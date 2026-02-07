import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {
  ImportService,
  JuriesService,
  SessionsService,
  type DraftPlan,
  type ImportError,
  type Jury,
} from '../../apiConfig';
import LoadingSpinner from '../shared/LoadingSpinner';
import Modal from '../shared/Modal';
import { localDateTimeToISO, isoToLocalDateTime } from '../../utils/dateUtils';
import './ImportPdfModal.css';

// Default scheduling constants (should match SessionWizard)
const DEFAULT_TIME_BEFORE_FIRST_SLOT = 60; // minutes

interface ImportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  file: File | null;
  sessionLabel: string;
  startTime: string;
  juryPoolIds: number[];
  juriesPerRoom: number;
}

interface ParseState {
  status: 'idle' | 'parsing' | 'parsed' | 'error';
  draftPlan: DraftPlan | null;
  error: string | null;
  importError: ImportError | null;
}

const ImportPdfModal = ({ isOpen, onClose }: ImportPdfModalProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    sessionLabel: '',
    startTime: new Date().toISOString(), // Default to current datetime
    juryPoolIds: [],
    juriesPerRoom: 1,
  });

  const [parseState, setParseState] = useState<ParseState>({
    status: 'idle',
    draftPlan: null,
    error: null,
    importError: null,
  });

  const [juries, setJuries] = useState<Jury[]>([]);
  const [loadingJuries, setLoadingJuries] = useState(false);

  // Load juries when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJuries();
    }
  }, [isOpen]);

  const loadJuries = async () => {
    try {
      setLoadingJuries(true);
      const juriesData = await JuriesService.getAllJuries();
      setJuries(juriesData);
    } catch (err) {
      console.error('Failed to load juries:', err);
      toast.error('Failed to load jury pool');
    } finally {
      setLoadingJuries(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    // Auto-fill session label with filename (without extension) when a file is selected
    const sessionLabel = file ? file.name.replace(/\.[^/.]+$/, '') : formData.sessionLabel;

    setFormData({ ...formData, file, sessionLabel });

    // Reset parse state when file changes
    setParseState({
      status: 'idle',
      draftPlan: null,
      error: null,
      importError: null,
    });
  };

  const handleParsePdf = async () => {
    if (!formData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate required fields before parsing
    if (!formData.startTime) {
      toast.error('Session start time is required before parsing');
      return;
    }
    if (formData.juryPoolIds.length === 0) {
      toast.error('Please select at least one jury before parsing');
      return;
    }

    try {
      setParseState({
        status: 'parsing',
        draftPlan: null,
        error: null,
        importError: null,
      });

      const draftPlan = await ImportService.parseSessionDocument({
        pdf: formData.file,
        session_label: formData.sessionLabel || undefined,
        date: formData.startTime.split('T')[0], // Extract YYYY-MM-DD from ISO string
        jury_ids: formData.juryPoolIds,
        juries_per_room: formData.juriesPerRoom,
      });

      // Pre-fill form data with parsed values if they were in the response
      setFormData({
        ...formData,
        sessionLabel: draftPlan.session_label || formData.sessionLabel,
        startTime: formData.startTime, // Keep the original datetime
        juriesPerRoom: draftPlan.juries_per_room,
        juryPoolIds: draftPlan.jury_ids,
      });

      setParseState({
        status: 'parsed',
        draftPlan,
        error: null,
        importError: null,
      });
      toast.success('PDF parsed successfully');

      // Scroll to review section after a short delay to allow React to complete DOM updates
      // and render the review section before scrolling
      const SCROLL_DELAY_MS = 100;
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, SCROLL_DELAY_MS);
    } catch (err: unknown) {
      let errorMessage = 'Failed to parse PDF';
      let importError: ImportError | null = null;

      if (err && typeof err === 'object' && 'body' in err) {
        const errBody = err.body as ImportError | string;

        if (typeof errBody === 'object' && 'message' in errBody) {
          // ImportError response with structured data
          importError = errBody;
          errorMessage = errBody.message;
        } else if (typeof errBody === 'string') {
          // Simple string error
          errorMessage = errBody;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setParseState({
        status: 'error',
        draftPlan: null,
        error: errorMessage,
        importError,
      });
      toast.error(errorMessage);
    }
  };

  const handleImport = async () => {
    // Validate required fields
    if (!formData.sessionLabel) {
      toast.error('Session label is required');
      return;
    }
    if (!formData.startTime) {
      toast.error('Session start time is required');
      return;
    }
    if (formData.juryPoolIds.length === 0) {
      toast.error('Please select at least one jury');
      return;
    }
    if (!parseState.draftPlan) {
      toast.error('Please parse the PDF first');
      return;
    }

    try {
      // Create the session first (we need a session ID for the preview)
      // Use the startTime directly as it's already in ISO format
      const session = await SessionsService.createSession({
        label: formData.sessionLabel,
        start_time: formData.startTime,
        slot_duration: parseState.draftPlan?.slot_duration ?? 30,
        time_between_slots: parseState.draftPlan?.time_between_slots ?? 5,
      });

      toast.success('Session created successfully');

      // Convert DraftPlan to WizardState (backend has already resolved all IDs)
      const wizardState = convertDraftPlanToWizardState(
        parseState.draftPlan,
        formData,
        session.id // Pass the created session ID
      );

      // Navigate to SessionWizard with the pre-populated state (step 3 for review)
      navigate('/sessions/wizard', { state: { wizardState, step: 3 } });

      // Close modal
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process import';
      toast.error(message);
    }
  };

  const convertDraftPlanToWizardState = (
    draftPlan: DraftPlan,
    formData: FormData,
    sessionId: number
  ) => {
    // Extract unique room IDs from slots
    const selectedRoomIds = Array.from(
      new Set(draftPlan.slots.map(slot => slot.room_id))
    );

    // Extract unique team IDs from slots
    const selectedTeamIds = Array.from(
      new Set(draftPlan.slots.flatMap(slot => slot.team_ids))
    );

    // Use jury IDs from the draft plan (they were passed in the request)
    const selectedJuryIds = draftPlan.jury_ids;

    // Calculate teams per room (use first slot as reference, or default)
    const teamsPerRoom = draftPlan.slots.length > 0
      ? draftPlan.slots[0].team_ids.length
      : 1;

    // Build room-level jury assignments from the first slot of each room
    // (Since backend assigns juries per room, all slots in a room should have the same juries)
    const roomJuryAssignments: Record<number, number[]> = {};
    for (const roomId of selectedRoomIds) {
      const roomSlot = draftPlan.slots.find(slot => slot.room_id === roomId);
      if (roomSlot && roomSlot.jury_ids && roomSlot.jury_ids.length > 0) {
        roomJuryAssignments[roomId] = [...roomSlot.jury_ids];
      } else {
        roomJuryAssignments[roomId] = [];
      }
    }

    // Convert slots to the wizard format
    const scheduleSlots = draftPlan.slots.map((slot, index) => {
      return {
        roomId: slot.room_id,
        slotIndex: index,
        startTime: slot.start_time,
        endTime: slot.end_time,
        teamIds: slot.team_ids,
        juryIds: slot.jury_ids,
      };
    });

    // Extract the session start time from formData if provided, or from the earliest slot
    // The formData.startTime is already in ISO format
    // If slots are available, use the earliest slot time; otherwise fallback to formData.startTime
    let sessionStartTime = formData.startTime;
    if (draftPlan.slots.length > 0) {
      // Sort slots by start time and use the earliest one
      // Filter out any slots with invalid dates before sorting
      const sortedSlots = [...draftPlan.slots]
        .filter(slot => {
          const date = new Date(slot.start_time);
          return !isNaN(date.getTime());
        })
        .sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      
      if (sortedSlots.length > 0) {
        sessionStartTime = sortedSlots[0].start_time;
      }
    }

    return {
      sessionId, // Include the session ID
      sessionLabel: formData.sessionLabel,
      selectedRoomIds,
      selectedTeamIds,
      selectedJuryIds,
      teamsPerRoom,
      juriesPerRoom: formData.juriesPerRoom,
      startTime: sessionStartTime,
      slotDuration: draftPlan.slot_duration ?? 30,
      timeBetweenSlots: draftPlan.time_between_slots ?? 5,
      timeBeforeFirstSlot: DEFAULT_TIME_BEFORE_FIRST_SLOT,
      roomJuryAssignments,
      scheduleSlots,
    };
  };

  const handleRetry = () => {
    setParseState({
      status: 'idle',
      draftPlan: null,
      error: null,
      importError: null,
    });
  };

  const handleJurySelection = (juryId: number) => {
    const isSelected = formData.juryPoolIds.includes(juryId);
    const newJuryPoolIds = isSelected
      ? formData.juryPoolIds.filter(id => id !== juryId)
      : [...formData.juryPoolIds, juryId];

    setFormData({ ...formData, juryPoolIds: newJuryPoolIds });
  };

  const modalFooter = parseState.status === 'parsed' && (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="btn btn-primary" onClick={handleImport}>
        Import and Review
      </button>
    </>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Import from PDF"
      subtitle="Upload and parse a PDF schedule document"
      footer={modalFooter}
    >
      <form className="import-pdf-form" onSubmit={(e) => e.preventDefault()}>
        {/* Step 1: Choose PDF File */}
        <div className="form-section">
          <h3>1. Choose PDF File</h3>
          <div className="form-group">
            <label htmlFor="pdfFile">PDF File *</label>
            <input
              ref={fileInputRef}
              id="pdfFile"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={parseState.status === 'parsing'}
            />
            {formData.file && (
              <p className="file-info">Selected: {formData.file.name}</p>
            )}
          </div>
        </div>

        {/* Step 2: Provide Required Information */}
        <div className="form-section">
          <h3>2. Provide Required Information</h3>

          {/* Session Label - Auto-filled from filename */}
          <div className="form-group">
            <label htmlFor="sessionLabel">Session Label (Auto-filled from filename)</label>
            <input
              id="sessionLabel"
              type="text"
              value={formData.sessionLabel}
              onChange={(e) => setFormData({ ...formData, sessionLabel: e.target.value })}
              placeholder="e.g., Annual Competition 2024"
            />
          </div>

          {/* Session Start Time - REQUIRED */}
          <div className="form-group">
            <label htmlFor="startTime">Session Start Time *</label>
            <input
              id="startTime"
              type="datetime-local"
              value={isoToLocalDateTime(formData.startTime)}
              onChange={(e) => {
                const isoString = localDateTimeToISO(e.target.value);
                // Allow clearing the field or setting a valid value
                setFormData({ ...formData, startTime: isoString || '' });
              }}
              required
            />
            <small>Required for parsing the PDF schedule and proper analytics</small>
          </div>

          {/* Jury Pool Selection - REQUIRED */}
          <div className="form-group">
            <div className="form-group-header">
              <label>Select Jury Pool *</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allJuryIds = juries.map((jury) => jury.id);
                    setFormData({ ...formData, juryPoolIds: allJuryIds });
                  }}
                >
                  Select All
                </button>
                <span className="control-separator">|</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setFormData({ ...formData, juryPoolIds: [] });
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            {loadingJuries ? (
              <LoadingSpinner message="Loading juries..." />
            ) : (
              <div className="jury-pool-selection">
                {juries.map((jury) => (
                  <label key={jury.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.juryPoolIds.includes(jury.id)}
                      onChange={() => handleJurySelection(jury.id)}
                    />
                    {jury.label}
                  </label>
                ))}
              </div>
            )}
            <small>Required for automatic jury assignment during parsing</small>
          </div>

          {/* Scheduling Parameters */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="juriesPerRoom">Juries per Room *</label>
              <input
                id="juriesPerRoom"
                type="number"
                min="1"
                value={formData.juriesPerRoom}
                onChange={(e) => setFormData({ ...formData, juriesPerRoom: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-magic"
            onClick={handleParsePdf}
            disabled={!formData.file || parseState.status === 'parsing'}
          >
            {parseState.status === 'parsing' ? 'Parsing PDF...' : 'Launch PDF Parsing'}
          </button>

          {/* Parse Progress */}
          {parseState.status === 'parsing' && (
            <div className="parse-progress">
              <div className="progress-spinner"></div>
              <p>Parsing PDF and extracting scheduling data...</p>
            </div>
          )}

          {/* Parse Status */}
          {parseState.status === 'parsed' && (
            <div className="parse-success">
              <p>✓ PDF parsed successfully</p>
              <p className="parse-info">
                Found {parseState.draftPlan?.slots.length || 0} slots
              </p>
            </div>
          )}

          {parseState.status === 'error' && (
            <div className="parse-error">
              <p className="error-message">✗ {parseState.error}</p>

              {/* Missing Rooms */}
              {parseState.importError?.missing_rooms && parseState.importError.missing_rooms.length > 0 && (
                <div className="missing-entities">
                  <h4>Missing Rooms ({parseState.importError.missing_rooms.length}):</h4>
                  <ul className="missing-list">
                    {parseState.importError.missing_rooms.map((room, idx) => (
                      <li key={idx}>{room}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-action"
                    onClick={() => {
                      navigate('/rooms');
                      onClose();
                    }}
                  >
                    Go to Rooms → Create Missing Rooms
                  </button>
                </div>
              )}

              {/* Missing Teams */}
              {parseState.importError?.missing_teams && parseState.importError.missing_teams.length > 0 && (
                <div className="missing-entities">
                  <h4>Missing Teams ({parseState.importError.missing_teams.length}):</h4>
                  <ul className="missing-list">
                    {parseState.importError.missing_teams.map((team, idx) => (
                      <li key={idx}>{team}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-action"
                    onClick={() => {
                      navigate('/teams');
                      onClose();
                    }}
                  >
                    Go to Teams → Create Missing Teams
                  </button>
                </div>
              )}

              {/* Extracted Slots Context */}
              {parseState.importError?.extracted_slots && parseState.importError.extracted_slots.length > 0 && (
                <div className="extracted-context">
                  <h4>Extracted Schedule Context:</h4>
                  <div className="context-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Time</th>
                          <th>Teams</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseState.importError.extracted_slots.map((slot, idx) => (
                          <tr key={idx}>
                            <td>{slot.room_label}</td>
                            <td>{slot.start_time} - {slot.end_time}</td>
                            <td>{slot.team_labels.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-link"
                onClick={handleRetry}
              >
                {parseState.importError?.missing_rooms || parseState.importError?.missing_teams
                  ? 'Retry Import'
                  : 'Try Again'}
              </button>
            </div>
          )}
        </div>

        {/* Review Section - only shown after successful parse */}
        {parseState.status === 'parsed' && (
          <div className="form-section" ref={reviewSectionRef}>
            <h3>3. Review and Import</h3>
            <p>PDF has been successfully parsed. Click "Import and Review" to continue to the session wizard.</p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ImportPdfModal;
