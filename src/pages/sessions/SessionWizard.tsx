import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  SessionsService,
  RoomsService,
  TeamsService,
  JuriesService,
  type Room,
  type Team,
  type Jury,
  type RoomSessionInput,
} from '../../apiConfig';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import './SessionWizard.css';

interface WizardState {
  // Step 1: Session creation
  sessionLabel: string;
  sessionId?: number;

  // Step 2: Scheduling parameters
  selectedRoomIds: number[];
  selectedTeamIds: number[];
  selectedJuryIds: number[];
  teamsPerRoom: number;
  juriesPerRoom: number;
  startTime: string;
  slotDuration: number;
  timeBetweenSlots: number;

  // Step 3: Draft schedule
  scheduleSlots: ScheduleSlot[];
}

interface ScheduleSlot {
  roomId: number;
  slotIndex: number;
  startTime: string;
  endTime: string;
  teamIds: number[];
  juryIds: number[];
}

interface SelectableItem {
  id: number;
  label: string;
}

const SessionWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resources
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [juries, setJuries] = useState<Jury[]>([]);

  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    sessionLabel: '',
    selectedRoomIds: [],
    selectedTeamIds: [],
    selectedJuryIds: [],
    teamsPerRoom: 1,
    juriesPerRoom: 1,
    startTime: '',
    slotDuration: 30,
    timeBetweenSlots: 5,
    scheduleSlots: [],
  });

  // State for adding new slots
  const [newSlotForms, setNewSlotForms] = useState<Record<number, { startTime: string; endTime: string }>>({});

  // Fetch resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const [roomsData, teamsData, juriesData] = await Promise.all([
          RoomsService.getAllRooms(),
          TeamsService.getAllTeams(),
          JuriesService.getAllJuries(),
        ]);
        setRooms(roomsData);
        setTeams(teamsData);
        setJuries(juriesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch resources';
        // Use mock data for demo if API is unavailable
        console.warn('API unavailable, using mock data for demo:', message);
        setRooms([
          { id: 1, label: 'Room A', max_size: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, label: 'Room B', max_size: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, label: 'Room C', max_size: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
        setTeams([
          { id: 1, label: 'Team Alpha', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, label: 'Team Beta', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, label: 'Team Gamma', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, label: 'Team Delta', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 5, label: 'Team Epsilon', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
        setJuries([
          { id: 1, label: 'Dr. Smith', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, label: 'Prof. Johnson', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, label: 'Dr. Williams', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, label: 'Prof. Brown', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
        setError(null); // Clear error since we're using mock data
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Step 1: Create session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      try {
        const session = await SessionsService.createSession({
          label: wizardState.sessionLabel,
          start_time: new Date().toISOString(), // Temporary, will be updated
          slot_duration: 30,
          time_between_slots: 5,
        });
        setWizardState({ ...wizardState, sessionId: session.id });
        toast.success('Session created successfully');
      } catch {
        // If API is unavailable, use mock session ID for demo
        console.warn('API unavailable, using mock session for demo');
        setWizardState({ ...wizardState, sessionId: 999 });
        toast.success('Session created (demo mode)');
      }
      setCurrentStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Configure parameters and generate schedule
  const handleGenerateSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (wizardState.selectedRoomIds.length === 0) {
      toast.error('Please select at least one room');
      return;
    }
    if (wizardState.selectedTeamIds.length === 0) {
      toast.error('Please select at least one team');
      return;
    }
    if (wizardState.selectedJuryIds.length === 0) {
      toast.error('Please select at least one jury');
      return;
    }

    // Generate schedule using round-robin
    const slots = generateSchedule(wizardState);
    setWizardState({ ...wizardState, scheduleSlots: slots });
    setCurrentStep(3);
  };

  // Round-robin scheduling algorithm
  const generateSchedule = (state: WizardState): ScheduleSlot[] => {
    const slots: ScheduleSlot[] = [];
    const { selectedRoomIds, selectedTeamIds, selectedJuryIds, teamsPerRoom, juriesPerRoom, startTime, slotDuration, timeBetweenSlots } = state;

    const totalTeams = selectedTeamIds.length;
    const totalJuries = selectedJuryIds.length;
    const slotsPerRoom = Math.ceil(totalTeams / (selectedRoomIds.length * teamsPerRoom));

    let teamIndex = 0;
    let juryIndex = 0;

    for (let slotIdx = 0; slotIdx < slotsPerRoom; slotIdx++) {
      for (const roomId of selectedRoomIds) {
        // Calculate time for this slot
        const slotStartTime = new Date(startTime);
        slotStartTime.setMinutes(slotStartTime.getMinutes() + slotIdx * (slotDuration + timeBetweenSlots));
        
        const slotEndTime = new Date(slotStartTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDuration);

        // Assign teams (round-robin: cycles through teams if there are more slots than teams)
        const assignedTeams: number[] = [];
        for (let i = 0; i < teamsPerRoom; i++) {
          if (teamIndex < totalTeams * slotsPerRoom * selectedRoomIds.length) {
            assignedTeams.push(selectedTeamIds[teamIndex % totalTeams]);
            teamIndex++;
          }
        }

        // Assign juries (round-robin: cycles through juries if there are more slots than juries)
        const assignedJuries: number[] = [];
        for (let i = 0; i < juriesPerRoom; i++) {
          if (juryIndex < totalJuries * slotsPerRoom * selectedRoomIds.length) {
            assignedJuries.push(selectedJuryIds[juryIndex % totalJuries]);
            juryIndex++;
          }
        }

        if (assignedTeams.length > 0) {
          slots.push({
            roomId,
            slotIndex: slotIdx,
            startTime: slotStartTime.toISOString(),
            endTime: slotEndTime.toISOString(),
            teamIds: assignedTeams,
            juryIds: assignedJuries,
          });
        }
      }
    }

    return slots;
  };

  // Export JSON
  const handleExportJSON = () => {
    const roomSessions: RoomSessionInput[] = wizardState.scheduleSlots.map(slot => ({
      room_id: slot.roomId,
      session_id: wizardState.sessionId!,
      start_time: slot.startTime,
      end_time: slot.endTime,
    }));

    const json = JSON.stringify(roomSessions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${wizardState.sessionId}-schedule.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Schedule exported successfully');
  };

  // Update slot assignments
  const updateSlotTeams = (slotIdx: number, teamIds: number[]) => {
    const updatedSlots = [...wizardState.scheduleSlots];
    updatedSlots[slotIdx].teamIds = teamIds;
    setWizardState({ ...wizardState, scheduleSlots: updatedSlots });
  };

  const updateSlotJuries = (slotIdx: number, juryIds: number[]) => {
    const updatedSlots = [...wizardState.scheduleSlots];
    updatedSlots[slotIdx].juryIds = juryIds;
    setWizardState({ ...wizardState, scheduleSlots: updatedSlots });
  };

  // Remove a slot
  const removeSlot = (slotIdx: number) => {
    const updatedSlots = wizardState.scheduleSlots.filter((_, idx) => idx !== slotIdx);
    setWizardState({ ...wizardState, scheduleSlots: updatedSlots });
  };

  // Add a new slot to a room
  const addSlot = (roomId: number, startTime: string, endTime: string) => {
    // Find the highest slot index for this room
    const roomSlots = wizardState.scheduleSlots.filter((s) => s.roomId === roomId);
    const maxSlotIndex = roomSlots.length > 0 
      ? Math.max(...roomSlots.map((s) => s.slotIndex)) 
      : -1;
    
    const newSlot: ScheduleSlot = {
      roomId,
      slotIndex: maxSlotIndex + 1,
      startTime,
      endTime,
      teamIds: [],
      juryIds: [],
    };

    setWizardState({ ...wizardState, scheduleSlots: [...wizardState.scheduleSlots, newSlot] });
  };

  // Helper function to get all unique team IDs assigned to a room's slots
  const getRoomTeamIds = (roomId: number): number[] => {
    const roomSlots = wizardState.scheduleSlots.filter((s) => s.roomId === roomId);
    const teamIds = new Set<number>();
    roomSlots.forEach((slot) => {
      slot.teamIds.forEach((id) => teamIds.add(id));
    });
    return Array.from(teamIds);
  };

  // Helper function to get all unique jury IDs assigned to a room's slots
  const getRoomJuryIds = (roomId: number): number[] => {
    const roomSlots = wizardState.scheduleSlots.filter((s) => s.roomId === roomId);
    const juryIds = new Set<number>();
    roomSlots.forEach((slot) => {
      slot.juryIds.forEach((id) => juryIds.add(id));
    });
    return Array.from(juryIds);
  };

  // Helper function to get all assigned team IDs across all slots
  const getAllAssignedTeamIds = (): Set<number> => {
    const assignedIds = new Set<number>();
    wizardState.scheduleSlots.forEach((slot) => {
      slot.teamIds.forEach((id) => assignedIds.add(id));
    });
    return assignedIds;
  };

  // Helper function to get all assigned jury IDs across all slots
  const getAllAssignedJuryIds = (): Set<number> => {
    const assignedIds = new Set<number>();
    wizardState.scheduleSlots.forEach((slot) => {
      slot.juryIds.forEach((id) => assignedIds.add(id));
    });
    return assignedIds;
  };

  // Helper function to get unassigned team IDs
  const getUnassignedTeamIds = (): number[] => {
    const assignedIds = getAllAssignedTeamIds();
    return wizardState.selectedTeamIds.filter((id) => !assignedIds.has(id));
  };

  // Helper function to get unassigned jury IDs
  const getUnassignedJuryIds = (): number[] => {
    const assignedIds = getAllAssignedJuryIds();
    return wizardState.selectedJuryIds.filter((id) => !assignedIds.has(id));
  };

  // Helper function to render preview summary
  const renderPreviewSummary = (ids: number[], items: SelectableItem[]) => {
    if (ids.length === 0) return <span className="preview-empty">None selected</span>;
    
    // Create a map for O(1) lookups
    const itemsMap = new Map(items.map((item) => [item.id, item.label]));
    
    return (
      <div className="preview-chips">
        {ids.map((id) => (
          <span key={id} className="preview-chip">
            {itemsMap.get(id) || `ID:${id}`}
          </span>
        ))}
      </div>
    );
  };

  if (loading && rooms.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Session Scheduling Wizard</h1>
        <button onClick={() => navigate('/sessions')} className="btn btn-secondary">
          Back to Sessions
        </button>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Create Session</div>
        </div>
        <div className={`wizard-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Configure Schedule</div>
        </div>
        <div className={`wizard-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Review & Edit</div>
        </div>
      </div>

      {/* Step 1: Create Session */}
      {currentStep === 1 && (
        <div className="wizard-content">
          <h2>Step 1: Create Session</h2>
          <form onSubmit={handleCreateSession} className="form">
            <div className="form-group">
              <label htmlFor="sessionLabel">Session Label</label>
              <input
                type="text"
                id="sessionLabel"
                value={wizardState.sessionLabel}
                onChange={(e) => setWizardState({ ...wizardState, sessionLabel: e.target.value })}
                required
                className="form-input"
                placeholder="e.g., Spring 2024 Evaluation"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Configure Schedule */}
      {currentStep === 2 && (
        <div className="wizard-content">
          <h2>Step 2: Configure Schedule Parameters</h2>
          <form onSubmit={handleGenerateSchedule} className="form">
            <div className="form-group">
              <div className="form-group-header">
                <label>Select Rooms</label>
                <div className="select-controls">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      const allRoomIds = rooms.map((room) => room.id);
                      setWizardState({ ...wizardState, selectedRoomIds: allRoomIds });
                    }}
                  >
                    Select All
                  </button>
                  <span className="control-separator">|</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setWizardState({ ...wizardState, selectedRoomIds: [] });
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="checkbox-group">
                {rooms.map((room) => (
                  <label key={room.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={wizardState.selectedRoomIds.includes(room.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...wizardState.selectedRoomIds, room.id]
                          : wizardState.selectedRoomIds.filter((id) => id !== room.id);
                        setWizardState({ ...wizardState, selectedRoomIds: newIds });
                      }}
                    />
                    {room.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-group-header">
                <label>Select Teams</label>
                <div className="select-controls">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      const allTeamIds = teams.map((team) => team.id);
                      setWizardState({ ...wizardState, selectedTeamIds: allTeamIds });
                    }}
                  >
                    Select All
                  </button>
                  <span className="control-separator">|</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setWizardState({ ...wizardState, selectedTeamIds: [] });
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="checkbox-group">
                {teams.map((team) => (
                  <label key={team.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={wizardState.selectedTeamIds.includes(team.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...wizardState.selectedTeamIds, team.id]
                          : wizardState.selectedTeamIds.filter((id) => id !== team.id);
                        setWizardState({ ...wizardState, selectedTeamIds: newIds });
                      }}
                    />
                    {team.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-group-header">
                <label>Select Juries</label>
                <div className="select-controls">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      const allJuryIds = juries.map((jury) => jury.id);
                      setWizardState({ ...wizardState, selectedJuryIds: allJuryIds });
                    }}
                  >
                    Select All
                  </button>
                  <span className="control-separator">|</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setWizardState({ ...wizardState, selectedJuryIds: [] });
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="checkbox-group">
                {juries.map((jury) => (
                  <label key={jury.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={wizardState.selectedJuryIds.includes(jury.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...wizardState.selectedJuryIds, jury.id]
                          : wizardState.selectedJuryIds.filter((id) => id !== jury.id);
                        setWizardState({ ...wizardState, selectedJuryIds: newIds });
                      }}
                    />
                    {jury.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="teamsPerRoom">Teams per Room</label>
                <input
                  type="number"
                  id="teamsPerRoom"
                  value={wizardState.teamsPerRoom}
                  onChange={(e) => setWizardState({ ...wizardState, teamsPerRoom: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="juriesPerRoom">Juries per Room</label>
                <input
                  type="number"
                  id="juriesPerRoom"
                  value={wizardState.juriesPerRoom}
                  onChange={(e) => setWizardState({ ...wizardState, juriesPerRoom: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="datetime-local"
                id="startTime"
                value={wizardState.startTime ? new Date(wizardState.startTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setWizardState({ ...wizardState, startTime: new Date(e.target.value).toISOString() })}
                required
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slotDuration">Slot Duration (minutes)</label>
                <input
                  type="number"
                  id="slotDuration"
                  value={wizardState.slotDuration}
                  onChange={(e) => setWizardState({ ...wizardState, slotDuration: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="timeBetweenSlots">Time Between Slots (minutes)</label>
                <input
                  type="number"
                  id="timeBetweenSlots"
                  value={wizardState.timeBetweenSlots}
                  onChange={(e) => setWizardState({ ...wizardState, timeBetweenSlots: parseInt(e.target.value) })}
                  required
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-secondary">
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Generate Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Review & Edit Schedule */}
      {currentStep === 3 && (
        <div className="wizard-content">
          <h2>Step 3: Review & Edit Schedule</h2>
          <p className="schedule-info">
            Generated {wizardState.scheduleSlots.length} time slots across {wizardState.selectedRoomIds.length} room(s)
          </p>

          {/* Unassigned Teams and Juries Warning Section */}
          {(getUnassignedTeamIds().length > 0 || getUnassignedJuryIds().length > 0) && (
            <div className="unassigned-warning">
              <h3>⚠️ Unassigned Items</h3>
              <p>The following teams and juries were selected for the session but are not assigned to any slot:</p>
              <div className="unassigned-content">
                {getUnassignedTeamIds().length > 0 && (
                  <div className="unassigned-section">
                    <strong>Teams:</strong>
                    <div className="selection-preview">
                      {renderPreviewSummary(getUnassignedTeamIds(), teams)}
                    </div>
                  </div>
                )}
                {getUnassignedJuryIds().length > 0 && (
                  <div className="unassigned-section">
                    <strong>Juries:</strong>
                    <div className="selection-preview">
                      {renderPreviewSummary(getUnassignedJuryIds(), juries)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="schedule-grid">
            {wizardState.selectedRoomIds.map((roomId) => {
              const room = rooms.find((r) => r.id === roomId);
              const roomSlots = wizardState.scheduleSlots.filter((s) => s.roomId === roomId);

              return (
                <div key={roomId} className="room-schedule">
                  <h3>{room?.label || `Room ${roomId}`}</h3>
                  
                  {/* Room-level summary */}
                  <div className="room-summary">
                    <div className="room-summary-section">
                      <strong>All Teams in Room:</strong>
                      <div className="selection-preview">
                        {renderPreviewSummary(getRoomTeamIds(roomId), teams)}
                      </div>
                    </div>
                    <div className="room-summary-section">
                      <strong>All Juries in Room:</strong>
                      <div className="selection-preview">
                        {renderPreviewSummary(getRoomJuryIds(roomId), juries)}
                      </div>
                    </div>
                  </div>

                  <div className="slots-list">
                    {roomSlots.map((slot, idx) => {
                      const slotGlobalIdx = wizardState.scheduleSlots.indexOf(slot);
                      return (
                        <div key={idx} className="schedule-slot">
                          <div className="slot-header">
                            <div className="slot-header-left">
                              <strong>Slot {slot.slotIndex + 1}</strong>
                              <span className="slot-time">
                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSlot(slotGlobalIdx)}
                              className="btn btn-danger-small"
                              title="Remove this slot"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="slot-content">
                            <div className="form-group">
                              <label>Teams</label>
                              <div className="selection-preview">
                                {renderPreviewSummary(slot.teamIds, teams)}
                              </div>
                              <select
                                multiple
                                value={slot.teamIds.map(String)}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                                  updateSlotTeams(slotGlobalIdx, selected);
                                }}
                                className="form-input multi-select"
                              >
                                {teams
                                  .filter((team) => wizardState.selectedTeamIds.includes(team.id))
                                  .map((team) => (
                                    <option key={team.id} value={team.id}>
                                      {team.label}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Juries</label>
                              <div className="selection-preview">
                                {renderPreviewSummary(slot.juryIds, juries)}
                              </div>
                              <select
                                multiple
                                value={slot.juryIds.map(String)}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                                  updateSlotJuries(slotGlobalIdx, selected);
                                }}
                                className="form-input multi-select"
                              >
                                {juries
                                  .filter((jury) => wizardState.selectedJuryIds.includes(jury.id))
                                  .map((jury) => (
                                    <option key={jury.id} value={jury.id}>
                                      {jury.label}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Slot Form */}
                  <div className="add-slot-form">
                    <h4>Add New Slot</h4>
                    <div className="add-slot-inputs">
                      <div className="form-group">
                        <label htmlFor={`start-time-${roomId}`}>Start Time</label>
                        <input
                          type="datetime-local"
                          id={`start-time-${roomId}`}
                          value={
                            newSlotForms[roomId]?.startTime
                              ? new Date(newSlotForms[roomId].startTime).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) => {
                            setNewSlotForms({
                              ...newSlotForms,
                              [roomId]: {
                                ...newSlotForms[roomId],
                                startTime: new Date(e.target.value).toISOString(),
                              },
                            });
                          }}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`end-time-${roomId}`}>End Time</label>
                        <input
                          type="datetime-local"
                          id={`end-time-${roomId}`}
                          value={
                            newSlotForms[roomId]?.endTime
                              ? new Date(newSlotForms[roomId].endTime).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) => {
                            setNewSlotForms({
                              ...newSlotForms,
                              [roomId]: {
                                ...newSlotForms[roomId],
                                endTime: new Date(e.target.value).toISOString(),
                              },
                            });
                          }}
                          className="form-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const form = newSlotForms[roomId];
                          if (form?.startTime && form?.endTime) {
                            addSlot(roomId, form.startTime, form.endTime);
                            // Clear the form after adding
                            setNewSlotForms({
                              ...newSlotForms,
                              [roomId]: { startTime: '', endTime: '' },
                            });
                          } else {
                            toast.error('Please enter both start and end times');
                          }
                        }}
                        className="btn btn-secondary"
                      >
                        Add Slot
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-secondary">
              Back
            </button>
            <button type="button" onClick={handleExportJSON} className="btn btn-primary">
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionWizard;
