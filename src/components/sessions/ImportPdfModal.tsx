import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  SessionsService,
  RoomsService,
  TeamsService,
  JuriesService,
  type DraftPlan,
  type Room,
  type Team,
  type Jury,
} from '../../apiConfig';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import './ImportPdfModal.css';

interface ImportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  file: File | null;
  sessionLabel: string;
  sessionDate: string;
  juryPoolIds: number[];
  juriesPerRoom: number;
  slotDuration: number;
  timeBetweenSlots: number;
}

interface ParseState {
  status: 'idle' | 'parsing' | 'parsed' | 'error';
  draftPlan: DraftPlan | null;
  error: string | null;
  parseErrors: string[];
}

const ImportPdfModal = ({ isOpen, onClose }: ImportPdfModalProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    sessionLabel: '',
    sessionDate: '',
    juryPoolIds: [],
    juriesPerRoom: 1,
    slotDuration: 30,
    timeBetweenSlots: 5,
  });

  const [parseState, setParseState] = useState<ParseState>({
    status: 'idle',
    draftPlan: null,
    error: null,
    parseErrors: [],
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
    setFormData({ ...formData, file });
    
    // Reset parse state when file changes
    setParseState({
      status: 'idle',
      draftPlan: null,
      error: null,
      parseErrors: [],
    });
  };

  const handleParsePdf = async () => {
    if (!formData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      setParseState({ status: 'parsing', draftPlan: null, error: null, parseErrors: [] });

      const draftPlan = await SessionsService.parsePdfForSession({
        formData: {
          file: formData.file,
        },
      });

      // Pre-fill form data with parsed values
      setFormData({
        ...formData,
        sessionLabel: formData.sessionLabel || draftPlan.session_label,
        sessionDate: formData.sessionDate || draftPlan.session_date,
        slotDuration: draftPlan.slot_duration,
        timeBetweenSlots: draftPlan.time_between_slots,
        juriesPerRoom: draftPlan.juries_per_room,
      });

      setParseState({ status: 'parsed', draftPlan, error: null, parseErrors: [] });
      toast.success('PDF parsed successfully');
    } catch (err: unknown) {
      let errorMessage = 'Failed to parse PDF';
      let parseErrors: string[] = [];

      if (err && typeof err === 'object' && 'body' in err) {
        const errBody = err.body as { message?: string; errors?: string[] };
        // ParseError response
        errorMessage = errBody.message || errorMessage;
        parseErrors = errBody.errors || [];
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setParseState({ status: 'error', draftPlan: null, error: errorMessage, parseErrors });
      toast.error(errorMessage);
    }
  };

  const handleImport = async () => {
    // Validate required fields
    if (!formData.sessionLabel) {
      toast.error('Session label is required');
      return;
    }
    if (!formData.sessionDate) {
      toast.error('Session date is required');
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
      // Fetch all entities to map labels to IDs
      const [rooms, teams, allJuries] = await Promise.all([
        RoomsService.getAllRooms(),
        TeamsService.getAllTeams(),
        JuriesService.getAllJuries(),
      ]);

      // Convert DraftPlan to WizardState
      const wizardState = await convertDraftPlanToWizardState(
        parseState.draftPlan,
        formData,
        rooms,
        teams,
        allJuries
      );

      // Navigate to SessionWizard with the pre-populated state
      navigate('/sessions/wizard', { state: { wizardState, step: 3 } });
      
      // Close modal
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process import';
      toast.error(message);
    }
  };

  const convertDraftPlanToWizardState = async (
    draftPlan: DraftPlan,
    formData: FormData,
    rooms: Room[],
    teams: Team[],
    allJuries: Jury[]
  ) => {
    // Map room labels to IDs
    const roomMap = new Map(rooms.map(r => [r.label.toLowerCase(), r.id]));
    const selectedRoomIds: number[] = [];
    const roomLabelToId = new Map<string, number>();

    for (const draftRoom of draftPlan.rooms) {
      const roomId = roomMap.get(draftRoom.label.toLowerCase());
      if (roomId) {
        selectedRoomIds.push(roomId);
        roomLabelToId.set(draftRoom.label, roomId);
      } else {
        throw new Error(`Room not found: ${draftRoom.label}`);
      }
    }

    // Map team labels to IDs
    const teamMap = new Map(teams.map(t => [t.label.toLowerCase(), t.id]));
    const selectedTeamIds: number[] = [];
    const teamLabelToId = new Map<string, number>();

    for (const draftTeam of draftPlan.teams) {
      const teamId = teamMap.get(draftTeam.label.toLowerCase());
      if (teamId) {
        selectedTeamIds.push(teamId);
        teamLabelToId.set(draftTeam.label, teamId);
      } else {
        throw new Error(`Team not found: ${draftTeam.label}`);
      }
    }

    // Use selected jury pool IDs from form
    const selectedJuryIds = formData.juryPoolIds;

    // Map jury labels to IDs for slots
    const juryMap = new Map(allJuries.map(j => [j.label.toLowerCase(), j.id]));
    const juryLabelToId = new Map<string, number>();

    for (const draftJury of draftPlan.juries) {
      const juryId = juryMap.get(draftJury.label.toLowerCase());
      if (juryId) {
        juryLabelToId.set(draftJury.label, juryId);
      } else {
        throw new Error(`Jury not found: ${draftJury.label}`);
      }
    }

    // Convert slots
    const scheduleSlots = draftPlan.slots.map((slot, index) => {
      const roomId = roomLabelToId.get(slot.room_label);
      if (!roomId) {
        throw new Error(`Room not found for slot: ${slot.room_label}`);
      }

      const teamIds = slot.team_labels.map(label => {
        const teamId = teamLabelToId.get(label);
        if (!teamId) {
          throw new Error(`Team not found for slot: ${label}`);
        }
        return teamId;
      });

      const juryIds = slot.jury_labels.map(label => {
        const juryId = juryLabelToId.get(label);
        if (!juryId) {
          throw new Error(`Jury not found for slot: ${label}`);
        }
        return juryId;
      });

      return {
        roomId,
        slotIndex: index,
        startTime: slot.start_time,
        endTime: slot.end_time,
        teamIds,
        juryIds,
      };
    });

    return {
      sessionLabel: formData.sessionLabel,
      selectedRoomIds,
      selectedTeamIds,
      selectedJuryIds,
      teamsPerRoom: draftPlan.teams_per_room,
      juriesPerRoom: formData.juriesPerRoom,
      startTime: formData.sessionDate,
      slotDuration: formData.slotDuration,
      timeBetweenSlots: formData.timeBetweenSlots,
      scheduleSlots,
    };
  };

  const handleRetry = () => {
    setParseState({
      status: 'idle',
      draftPlan: null,
      error: null,
      parseErrors: [],
    });
  };

  const handleJurySelection = (juryId: number) => {
    const isSelected = formData.juryPoolIds.includes(juryId);
    const newJuryPoolIds = isSelected
      ? formData.juryPoolIds.filter(id => id !== juryId)
      : [...formData.juryPoolIds, juryId];
    
    setFormData({ ...formData, juryPoolIds: newJuryPoolIds });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from PDF">
      <form className="import-pdf-form" onSubmit={(e) => e.preventDefault()}>
        {/* File Upload Section */}
        <div className="form-section">
          <h3>1. Upload PDF</h3>
          <div className="form-group">
            <label htmlFor="pdfFile">PDF File</label>
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

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleParsePdf}
            disabled={!formData.file || parseState.status === 'parsing'}
          >
            {parseState.status === 'parsing' ? 'Parsing PDF...' : 'Parse PDF'}
          </button>

          {/* Parse Status */}
          {parseState.status === 'parsed' && (
            <div className="parse-success">
              <p>✓ PDF parsed successfully</p>
              <p className="parse-info">
                Found {parseState.draftPlan?.teams.length || 0} teams, 
                {' '}{parseState.draftPlan?.juries.length || 0} juries, 
                {' '}{parseState.draftPlan?.rooms.length || 0} rooms, 
                {' '}{parseState.draftPlan?.slots.length || 0} slots
              </p>
            </div>
          )}

          {parseState.status === 'error' && (
            <div className="parse-error">
              <p className="error-message">✗ {parseState.error}</p>
              {parseState.parseErrors.length > 0 && (
                <ul className="error-list">
                  {parseState.parseErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn-link"
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Form Fields Section */}
        {parseState.status === 'parsed' && (
          <>
            <div className="form-section">
              <h3>2. Review and Complete Missing Fields</h3>

              <div className="form-group">
                <label htmlFor="sessionLabel">Session Label *</label>
                <input
                  id="sessionLabel"
                  type="text"
                  value={formData.sessionLabel}
                  onChange={(e) => setFormData({ ...formData, sessionLabel: e.target.value })}
                  placeholder="e.g., Annual Competition 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sessionDate">Session Date *</label>
                <input
                  id="sessionDate"
                  type="datetime-local"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Jury Pool *</label>
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="juriesPerRoom">Juries per Room</label>
                  <input
                    id="juriesPerRoom"
                    type="number"
                    min="1"
                    value={formData.juriesPerRoom}
                    onChange={(e) => setFormData({ ...formData, juriesPerRoom: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slotDuration">Slot Duration (min)</label>
                  <input
                    id="slotDuration"
                    type="number"
                    min="5"
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="timeBetweenSlots">Gap Between Slots (min)</label>
                  <input
                    id="timeBetweenSlots"
                    type="number"
                    min="0"
                    value={formData.timeBetweenSlots}
                    onChange={(e) => setFormData({ ...formData, timeBetweenSlots: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleImport}>
                Import and Review
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default ImportPdfModal;
