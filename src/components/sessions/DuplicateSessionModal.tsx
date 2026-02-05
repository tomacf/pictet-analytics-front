import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  SessionsService,
  TeamsService,
  JuriesService,
  RoomsService,
  type SessionExpanded,
  type Team,
  type Jury,
  type Room,
} from '../../apiConfig';
import Modal from '../shared/Modal';
import './DuplicateSessionModal.css';

interface DuplicateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSession: SessionExpanded | null;
}

interface DuplicateFormData {
  label: string;
  start_time: string;
  slot_duration: number;
  time_between_slots: number;
  time_before_first_slot: number;
  teams_per_room: number;
  juries_per_room: number;
  team_ids: number[];
  jury_ids: number[];
  room_ids: number[];
}

// Helper function to convert ISO string to local datetime-local format
const isoToLocalDatetimeInput = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

// Helper function to convert datetime-local input to ISO string
const localDatetimeInputToISO = (localDatetime: string): string => {
  if (!localDatetime) return '';
  return new Date(localDatetime).toISOString();
};

const DuplicateSessionModal = ({
  isOpen,
  onClose,
  sourceSession,
}: DuplicateSessionModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // All available resources
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allJuries, setAllJuries] = useState<Jury[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  // Form data
  const [formData, setFormData] = useState<DuplicateFormData>({
    label: '',
    start_time: '',
    slot_duration: 30,
    time_between_slots: 5,
    time_before_first_slot: 0,
    teams_per_room: 1,
    juries_per_room: 1,
    team_ids: [],
    jury_ids: [],
    room_ids: [],
  });

  // Load resources and prefill form when modal opens
  useEffect(() => {
    if (isOpen && sourceSession) {
      const loadResources = async () => {
        setLoadingResources(true);
        try {
          const [teamsData, juriesData, roomsData] = await Promise.all([
            TeamsService.getAllTeams(),
            JuriesService.getAllJuries(),
            RoomsService.getAllRooms(),
          ]);
          setAllTeams(teamsData);
          setAllJuries(juriesData);
          setAllRooms(roomsData);
        } catch (err) {
          console.warn('Failed to load resources:', err);
          // Use empty arrays if API fails
          setAllTeams([]);
          setAllJuries([]);
          setAllRooms([]);
        } finally {
          setLoadingResources(false);
        }
      };
      loadResources();

      // Prefill form from source session
      setFormData({
        label: `${sourceSession.label} (Copy)`,
        start_time: sourceSession.start_time,
        slot_duration: sourceSession.slot_duration,
        time_between_slots: sourceSession.time_between_slots,
        time_before_first_slot: 0, // Not stored on session model
        teams_per_room: 1, // Default, not stored on session model
        juries_per_room: 1, // Default, not stored on session model
        team_ids: sourceSession.teams?.map((t) => t.id) || [],
        jury_ids: sourceSession.juries?.map((j) => j.id) || [],
        room_ids: sourceSession.rooms?.map((r) => r.id) || [],
      });
      setShowAdvanced(false);
    }
  }, [isOpen, sourceSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    if (!formData.start_time) {
      toast.error('Please select a start time');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the new session via POST /api/sessions
      const newSession = await SessionsService.createSession({
        label: formData.label,
        start_time: formData.start_time,
        slot_duration: formData.slot_duration,
        time_between_slots: formData.time_between_slots,
      });

      // Step 2: Apply scope/params via PUT /api/sessions/{id}
      await SessionsService.updateSession(newSession.id, {
        label: formData.label,
        start_time: formData.start_time,
        slot_duration: formData.slot_duration,
        time_between_slots: formData.time_between_slots,
        team_ids: formData.team_ids,
        jury_ids: formData.jury_ids,
        room_ids: formData.room_ids,
      });

      toast.success('Session duplicated successfully');
      onClose();

      // Step 3: Navigate to Scheduling Wizard step 3 (Review & Edit) with preloaded state
      navigate('/sessions/wizard', {
        state: {
          wizardState: {
            sessionLabel: formData.label,
            sessionId: newSession.id,
            selectedRoomIds: formData.room_ids,
            selectedTeamIds: formData.team_ids,
            selectedJuryIds: formData.jury_ids,
            teamsPerRoom: formData.teams_per_room,
            juriesPerRoom: formData.juries_per_room,
            startTime: isoToLocalDatetimeInput(formData.start_time),
            slotDuration: formData.slot_duration,
            timeBetweenSlots: formData.time_between_slots,
            scheduleSlots: [], // Empty slots, user will generate or add manually
          },
          step: 3, // Navigate directly to step 3 (Review & Edit)
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate session';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!sourceSession) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Duplicate Session">
      <form onSubmit={handleSubmit} className="form duplicate-session-form">
        {loadingResources ? (
          <div className="loading-container">
            <span>Loading resources...</span>
          </div>
        ) : (
          <>
            <div className="form-section">
              <h3 className="form-section-title">Required Information</h3>

              <div className="form-group">
                <label htmlFor="duplicate-label">Session Name *</label>
                <input
                  type="text"
                  id="duplicate-label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  className="form-input"
                  disabled={loading}
                  placeholder="Enter a name for the new session"
                />
              </div>

              <div className="form-group">
                <label htmlFor="duplicate-start-time">Start Time *</label>
                <input
                  type="datetime-local"
                  id="duplicate-start-time"
                  value={isoToLocalDatetimeInput(formData.start_time)}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: localDatetimeInputToISO(e.target.value) })
                  }
                  required
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-section">
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={loading}
              >
                {showAdvanced ? '▼' : '▶'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="advanced-section">
                  <div className="form-subsection">
                    <h4>Scheduling Parameters</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="duplicate-slot-duration">Slot Duration (min)</label>
                        <input
                          type="number"
                          id="duplicate-slot-duration"
                          value={formData.slot_duration}
                          onChange={(e) =>
                            setFormData({ ...formData, slot_duration: parseInt(e.target.value) || 0 })
                          }
                          min="1"
                          className="form-input"
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="duplicate-time-between">Time Between Slots (min)</label>
                        <input
                          type="number"
                          id="duplicate-time-between"
                          value={formData.time_between_slots}
                          onChange={(e) =>
                            setFormData({ ...formData, time_between_slots: parseInt(e.target.value) || 0 })
                          }
                          min="0"
                          className="form-input"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="duplicate-teams-per-room">Teams per Room</label>
                        <input
                          type="number"
                          id="duplicate-teams-per-room"
                          value={formData.teams_per_room}
                          onChange={(e) =>
                            setFormData({ ...formData, teams_per_room: parseInt(e.target.value) || 1 })
                          }
                          min="1"
                          className="form-input"
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="duplicate-juries-per-room">Juries per Room</label>
                        <input
                          type="number"
                          id="duplicate-juries-per-room"
                          value={formData.juries_per_room}
                          onChange={(e) =>
                            setFormData({ ...formData, juries_per_room: parseInt(e.target.value) || 1 })
                          }
                          min="1"
                          className="form-input"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Session Scope</h4>

                    <div className="form-group">
                      <div className="form-group-header">
                        <label>Teams ({formData.team_ids.length} selected)</label>
                        <div className="select-controls">
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              setFormData({ ...formData, team_ids: allTeams.map((t) => t.id) })
                            }
                            disabled={loading}
                          >
                            Select All
                          </button>
                          <span className="control-separator">|</span>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setFormData({ ...formData, team_ids: [] })}
                            disabled={loading}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="checkbox-group scrollable">
                        {allTeams.length > 0 ? (
                          allTeams.map((team) => (
                            <label key={team.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.team_ids.includes(team.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.team_ids, team.id]
                                    : formData.team_ids.filter((id) => id !== team.id);
                                  setFormData({ ...formData, team_ids: newIds });
                                }}
                                disabled={loading}
                              />
                              {team.label}
                            </label>
                          ))
                        ) : (
                          <p className="no-data-text">No teams available</p>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-group-header">
                        <label>Juries ({formData.jury_ids.length} selected)</label>
                        <div className="select-controls">
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              setFormData({ ...formData, jury_ids: allJuries.map((j) => j.id) })
                            }
                            disabled={loading}
                          >
                            Select All
                          </button>
                          <span className="control-separator">|</span>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setFormData({ ...formData, jury_ids: [] })}
                            disabled={loading}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="checkbox-group scrollable">
                        {allJuries.length > 0 ? (
                          allJuries.map((jury) => (
                            <label key={jury.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.jury_ids.includes(jury.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.jury_ids, jury.id]
                                    : formData.jury_ids.filter((id) => id !== jury.id);
                                  setFormData({ ...formData, jury_ids: newIds });
                                }}
                                disabled={loading}
                              />
                              {jury.label}
                            </label>
                          ))
                        ) : (
                          <p className="no-data-text">No juries available</p>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-group-header">
                        <label>Rooms ({formData.room_ids.length} selected)</label>
                        <div className="select-controls">
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              setFormData({ ...formData, room_ids: allRooms.map((r) => r.id) })
                            }
                            disabled={loading}
                          >
                            Select All
                          </button>
                          <span className="control-separator">|</span>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setFormData({ ...formData, room_ids: [] })}
                            disabled={loading}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="checkbox-group scrollable">
                        {allRooms.length > 0 ? (
                          allRooms.map((room) => (
                            <label key={room.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.room_ids.includes(room.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.room_ids, room.id]
                                    : formData.room_ids.filter((id) => id !== room.id);
                                  setFormData({ ...formData, room_ids: newIds });
                                }}
                                disabled={loading}
                              />
                              {room.label}
                            </label>
                          ))
                        ) : (
                          <p className="no-data-text">No rooms available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Duplicating...' : 'Duplicate & Configure'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default DuplicateSessionModal;
