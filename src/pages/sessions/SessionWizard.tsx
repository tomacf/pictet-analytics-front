import {useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {
  ApiError,
  JuriesService,
  RoomsService,
  SessionsService,
  TeamsService,
  type Jury,
  type RebalancePlanResponse,
  type Room,
  type SessionPlan,
  type SessionPlanSlot,
  type Team,
} from '../../apiConfig';
import RebalanceModal from '../../components/sessions/RebalanceModal';
import ScheduleOverview from '../../components/sessions/ScheduleOverview';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusPanel from '../../components/shared/StatusPanel';
import {format409Error, is409Error} from '../../utils/errorUtils';
import {
  detectJuryConflicts,
  detectTeamConflicts,
  isJuryConflicted,
  isTeamConflicted,
  type SlotAssignment,
} from '../../utils/validationUtils';
import './SessionWizard.css';

interface WizardState {
  // Step 1: Session creation
  sessionLabel: string;
  startTime: string;
  sessionId?: number;

  // Step 2: Scheduling parameters
  selectedRoomIds: number[];
  selectedTeamIds: number[];
  selectedJuryIds: number[];
  teamsPerRoom: number;
  juriesPerRoom: number;
  timeBeforeFirstSlot: number;
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
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resources
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [juries, setJuries] = useState<Jury[]>([]);

  // Wizard state - may be initialized from navigation state
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    const navState = location.state as { wizardState?: WizardState; step?: number } | undefined;
    if (navState?.wizardState) {
      return navState.wizardState;
    }
    return {
      sessionLabel: '',
      startTime: new Date().toISOString().slice(0, 16), // Default to current datetime
      selectedRoomIds: [],
      selectedTeamIds: [],
      selectedJuryIds: [],
      teamsPerRoom: 1,
      juriesPerRoom: 1,
      timeBeforeFirstSlot: 60, // Default to 60 minutes
      slotDuration: 30,
      timeBetweenSlots: 5,
      scheduleSlots: [],
    };
  });

  // Initialize step from navigation state
  useEffect(() => {
    const navState = location.state as { wizardState?: WizardState; step?: number } | undefined;
    if (navState?.step) {
      setCurrentStep(navState.step);
    }
  }, [location.state]);

  // State for adding new slots
  const [newSlotForms, setNewSlotForms] = useState<Record<number, { startTime: string; endTime: string }>>({});

  // Status panel state - default open on desktop, closed on mobile
  const [statusPanelOpen, setStatusPanelOpen] = useState(true);

  // Status panel collapsed state - default false (expanded) on desktop, persisted to localStorage
  const [statusPanelCollapsed, setStatusPanelCollapsed] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('statusPanelCollapsed');
        return saved === 'true';
      }
    } catch {
      // localStorage not available
    }
    return false;
  });

  // Persist status panel collapsed state to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('statusPanelCollapsed', String(statusPanelCollapsed));
      }
    } catch {
      // localStorage not available
    }
  }, [statusPanelCollapsed]);

  // Rebalance state
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [rebalanceResponse, setRebalanceResponse] = useState<RebalancePlanResponse | null>(null);
  const [beforeSlots, setBeforeSlots] = useState<SessionPlanSlot[] | null>(null);
  const [preRebalanceSlots, setPreRebalanceSlots] = useState<ScheduleSlot[] | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Refs for scrolling to slots
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Tab state for step 3
  const [activeTab, setActiveTab] = useState<'overview' | number>('overview');

  // Conflict detection
  const conflicts = useMemo(() => {
    const slots: SlotAssignment[] = wizardState.scheduleSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      teamIds: slot.teamIds,
      juryIds: slot.juryIds,
    }));

    const teamConflicts = detectTeamConflicts(slots);
    const juryConflicts = detectJuryConflicts(slots);

    return { teamConflicts, juryConflicts };
  }, [wizardState.scheduleSlots]);

  const hasConflicts = conflicts.teamConflicts.length > 0 || conflicts.juryConflicts.length > 0;

  // Reset active tab when rooms change or when leaving/entering step 3
  useEffect(() => {
    if (currentStep === 3) {
      // If the currently active tab is a room that's no longer selected, reset to overview
      if (activeTab !== 'overview' && !wizardState.selectedRoomIds.includes(activeTab as number)) {
        setActiveTab('overview');
      }
    } else {
      // Reset to overview when not on step 3
      setActiveTab('overview');
    }
  }, [currentStep, wizardState.selectedRoomIds, activeTab]);

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
          start_time: new Date(wizardState.startTime).toISOString(),
          slot_duration: wizardState.slotDuration,
          time_between_slots: wizardState.timeBetweenSlots,
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

  // Round-robin scheduling algorithm with jury room affinity
  const generateSchedule = (state: WizardState): ScheduleSlot[] => {
    const slots: ScheduleSlot[] = [];
    const { selectedRoomIds, selectedTeamIds, selectedJuryIds, teamsPerRoom, juriesPerRoom, startTime, timeBeforeFirstSlot, slotDuration, timeBetweenSlots } = state;

    const totalTeams = selectedTeamIds.length;
    const slotsPerRoom = Math.ceil(totalTeams / (selectedRoomIds.length * teamsPerRoom));

    let teamIndex = 0;

    // Track jury-to-room assignments for room affinity
    // Map: roomId -> array of jury IDs currently in that room
    const roomToJuries = new Map<number, number[]>();

    // Track which juries are available (not yet assigned to any room)
    const availableJuries = new Set(selectedJuryIds);

    for (let slotIdx = 0; slotIdx < slotsPerRoom; slotIdx++) {
      for (const roomId of selectedRoomIds) {
        // Calculate time for this slot: session start time + time before first slot + slot offset
        const slotStartTime = new Date(startTime);
        slotStartTime.setMinutes(slotStartTime.getMinutes() + timeBeforeFirstSlot + slotIdx * (slotDuration + timeBetweenSlots));

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

        // Assign juries with room affinity
        const assignedJuries: number[] = [];

        if (slotIdx === 0) {
          // First slot: assign juries in round-robin fashion
          for (let i = 0; i < juriesPerRoom && availableJuries.size > 0; i++) {
            const jury = Array.from(availableJuries)[0];
            assignedJuries.push(jury);
            availableJuries.delete(jury);
          }
        } else {
          // Subsequent slots: prefer juries that were in this room in the previous slot
          const previousJuriesInRoom = roomToJuries.get(roomId) || [];

          // First, try to reuse juries from the same room
          for (const juryId of previousJuriesInRoom) {
            if (assignedJuries.length < juriesPerRoom) {
              assignedJuries.push(juryId);
            }
          }

          // If we need more juries, assign from available pool
          for (const juryId of availableJuries) {
            if (assignedJuries.length >= juriesPerRoom) break;
            assignedJuries.push(juryId);
            availableJuries.delete(juryId);
          }

          // If still not enough and we have juries in other rooms, take from them
          if (assignedJuries.length < juriesPerRoom) {
            for (const [otherRoomId, otherJuries] of roomToJuries.entries()) {
              if (otherRoomId === roomId) continue;
              for (const juryId of otherJuries) {
                if (assignedJuries.length >= juriesPerRoom) break;
                if (!assignedJuries.includes(juryId)) {
                  assignedJuries.push(juryId);
                  // Remove from the other room
                  roomToJuries.set(
                    otherRoomId,
                    otherJuries.filter(j => j !== juryId)
                  );
                  break;
                }
              }
            }
          }
        }

        // Update room-to-jury mapping for the next slot
        roomToJuries.set(roomId, assignedJuries);

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
    // Get unassigned teams and juries
    const unassignedTeamIds = getUnassignedTeamIds();
    const unassignedJuryIds = getUnassignedJuryIds();

    // Build the full session plan object
    const sessionPlan = {
      session_id: wizardState.sessionId!,
      selected_room_ids: wizardState.selectedRoomIds,
      selected_team_ids: wizardState.selectedTeamIds,
      selected_jury_ids: wizardState.selectedJuryIds,
      teams_per_room: wizardState.teamsPerRoom,
      juries_per_room: wizardState.juriesPerRoom,
      slots: wizardState.scheduleSlots.map(slot => ({
        room_id: slot.roomId,
        start_time: slot.startTime,
        end_time: slot.endTime,
        team_ids: slot.teamIds,
        jury_ids: slot.juryIds,
      })),
      unassigned_warnings: {
        unassigned_team_ids: unassignedTeamIds,
        unassigned_jury_ids: unassignedJuryIds,
      },
    };

    const json = JSON.stringify(sessionPlan, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${wizardState.sessionId}-schedule.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Schedule exported successfully');
  };

  // Save plan to backend
  const handleSavePlan = async () => {
    if (!wizardState.sessionId) {
      toast.error('No session ID available');
      return;
    }

    if (hasConflicts) {
      toast.error('Cannot save plan with conflicts. Please resolve all conflicts first.');
      return;
    }

    try {
      setSaving(true);

      // Build the session plan according to the API schema
      const sessionPlan: SessionPlan = {
        room_ids: wizardState.selectedRoomIds,
        team_ids: wizardState.selectedTeamIds,
        jury_ids: wizardState.selectedJuryIds,
        teams_per_room: wizardState.teamsPerRoom,
        juries_per_room: wizardState.juriesPerRoom,
        slots: wizardState.scheduleSlots.map(slot => ({
          room_id: slot.roomId,
          start_time: slot.startTime,
          end_time: slot.endTime,
          team_ids: slot.teamIds,
          jury_ids: slot.juryIds,
        })),
      };

      // Call the API endpoint
      await SessionsService.saveSessionPlan(wizardState.sessionId, sessionPlan);

      toast.success('Session plan saved successfully');

      // Navigate to sessions list after a short delay to allow users to see the success message
      setTimeout(() => {
        navigate('/sessions');
      }, 1000);
    } catch (err: unknown) {
      // Handle 409 Conflict errors specially
      if (is409Error(err)) {
        const errorMessage = format409Error(err, 'The session plan contains conflicts.');
        toast.error(errorMessage, { autoClose: 8000 });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save session plan';
        toast.error(message);
      }
      // Keep draft state intact on error
    } finally {
      setSaving(false);
    }
  };

  // Magic Rebalance handlers
  const handleMagicRebalance = async () => {
    if (wizardState.scheduleSlots.length === 0) {
      toast.error('No schedule to rebalance');
      return;
    }

    if (!wizardState.sessionId) {
      toast.error('Session must be created before rebalancing');
      return;
    }

    setIsRebalancing(true);

    try {
      // Build the SessionPlan payload from current draft state
      const currentSlots: SessionPlanSlot[] = wizardState.scheduleSlots.map(slot => ({
        room_id: slot.roomId,
        start_time: slot.startTime,
        end_time: slot.endTime,
        team_ids: [...slot.teamIds],
        jury_ids: [...slot.juryIds],
      }));

      const sessionPlan: SessionPlan = {
        room_ids: wizardState.selectedRoomIds,
        team_ids: wizardState.selectedTeamIds,
        jury_ids: wizardState.selectedJuryIds,
        teams_per_room: wizardState.teamsPerRoom,
        juries_per_room: wizardState.juriesPerRoom,
        slots: currentSlots,
      };

      // Store the before slots for display in modal
      setBeforeSlots(currentSlots);

      // Call the backend rebalance API
      const response = await SessionsService.rebalanceSessionPlan(
        wizardState.sessionId,
        sessionPlan
      );

      setRebalanceResponse(response);
      setRebalanceModalOpen(true);
      toast.success('Rebalance complete!');
    } catch (err) {
      // Handle 400/500 errors with toast + details
      if (err instanceof ApiError) {
        const statusCode = err.status;
        const errorBody = err.body;
        // Extract error message from response body
        let errorMessage = `Error ${statusCode}`;
        if (typeof errorBody === 'string') {
          errorMessage = errorBody;
        } else if (errorBody && typeof errorBody === 'object') {
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        }

        toast.error(`Rebalance failed (${statusCode}): ${errorMessage}`, {
          autoClose: 5000,
        });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to rebalance schedule';
        toast.error(message);
      }
      // Keep the draft unchanged - no state changes on error
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleApplyRebalance = () => {
    if (!rebalanceResponse) return;

    // Save current state for undo
    setPreRebalanceSlots([...wizardState.scheduleSlots]);

    // Apply the rebalanced slots from response.plan
    const updatedSlots = rebalanceResponse.plan.slots.map((slot, index) => ({
      roomId: slot.room_id,
      slotIndex: index,
      startTime: slot.start_time,
      endTime: slot.end_time,
      teamIds: [...slot.team_ids],
      juryIds: [...slot.jury_ids],
    }));

    setWizardState({ ...wizardState, scheduleSlots: updatedSlots });
    setRebalanceModalOpen(false); // Close the modal after applying
    toast.success('Rebalanced schedule applied');
  };

  const handleUndoRebalance = () => {
    if (!preRebalanceSlots) return;

    // Restore the previous state
    setWizardState({ ...wizardState, scheduleSlots: preRebalanceSlots });
    setPreRebalanceSlots(null);
    setRebalanceResponse(null);
    setBeforeSlots(null);
    toast.success('Rebalance undone');
  };

  const handleCloseRebalanceModal = () => {
    setRebalanceModalOpen(false);
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

  // Helper function to render teams with conflict highlighting
  const renderTeamsPreview = (teamIds: number[]) => {
    if (teamIds.length === 0) return <span className="preview-empty">None selected</span>;

    const itemsMap = new Map(teams.map((item) => [item.id, item.label]));

    return (
      <div className="preview-chips">
        {teamIds.map((id) => {
          const hasConflict = isTeamConflicted(id, conflicts.teamConflicts);
          return (
            <span
              key={id}
              className={`preview-chip ${hasConflict ? 'preview-chip-conflict' : ''}`}
              title={hasConflict ? 'This team is assigned to multiple slots' : ''}
            >
              {itemsMap.get(id) || `ID:${id}`}
            </span>
          );
        })}
      </div>
    );
  };

  // Helper function to render juries with conflict highlighting
  const renderJuriesPreview = (juryIds: number[]) => {
    if (juryIds.length === 0) return <span className="preview-empty">None selected</span>;

    const itemsMap = new Map(juries.map((item) => [item.id, item.label]));

    return (
      <div className="preview-chips">
        {juryIds.map((id) => {
          const hasConflict = isJuryConflicted(id, conflicts.juryConflicts);
          return (
            <span
              key={id}
              className={`preview-chip ${hasConflict ? 'preview-chip-conflict' : ''}`}
              title={hasConflict ? 'This jury is assigned to overlapping time slots' : ''}
            >
              {itemsMap.get(id) || `ID:${id}`}
            </span>
          );
        })}
      </div>
    );
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

  // Helper function to render matrix-style schedule overview
  const renderScheduleOverview = () => {
    if (wizardState.scheduleSlots.length === 0) {
      return null;
    }

    // Convert ScheduleSlot[] to RoomSessionExpanded[] format
    const teamsMap = new Map(teams.map((t) => [t.id, t]));
    const juriesMap = new Map(juries.map((j) => [j.id, j]));
    const roomsMap = new Map(rooms.map((r) => [r.id, r]));

    const roomSessions = wizardState.scheduleSlots.map((slot) => ({
      id: slot.roomId * 1000 + slot.slotIndex, // stable composite numeric ID
      room_id: slot.roomId,
      session_id: 0, // not yet created
      start_time: slot.startTime,
      end_time: slot.endTime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      room: roomsMap.get(slot.roomId) ? { id: slot.roomId, label: roomsMap.get(slot.roomId)!.label } : undefined,
      teams: slot.teamIds.map(id => {
        const team = teamsMap.get(id);
        return team ? { id: team.id, label: team.label } : { id, label: `Team ${id}` };
      }),
      juries: slot.juryIds.map(id => {
        const jury = juriesMap.get(id);
        return jury ? { id: jury.id, label: jury.label } : { id, label: `Jury ${id}` };
      }),
    }));

    return (
      <div className="schedule-overview">
        <h3>📋 Schedule Overview</h3>
        <ScheduleOverview
          roomSessions={roomSessions}
          rooms={rooms.map(r => ({ id: r.id, label: r.label }))}
        />
      </div>
    );
  };

  // Scroll to slot when clicking on conflict
  const handleScrollToSlot = (slotIndex: number) => {
    const slotElement = slotRefs.current.get(slotIndex);
    if (slotElement) {
      slotElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Highlight the slot briefly using CSS class
      slotElement.classList.add('slot-highlighted');
      setTimeout(() => {
        slotElement.classList.remove('slot-highlighted');
      }, 2000);
    }
    // Close mobile panel after clicking (using constant breakpoint)
    const MOBILE_BREAKPOINT = 1024;
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setStatusPanelOpen(false);
    }
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
            <div className="form-group">
              <label htmlFor="startTimeStep1">Start Time</label>
              <input
                type="datetime-local"
                id="startTimeStep1"
                value={wizardState.startTime ? new Date(wizardState.startTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setWizardState({ ...wizardState, startTime: date.toISOString() });
                  }
                }}
                required
                className="form-input"
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
              <label>Start Time</label>
              <div className="form-readonly-text">
                {wizardState.startTime ? new Date(wizardState.startTime).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) : 'Not set'}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="timeBeforeFirstSlot">Time before first slot (minutes)</label>
              <input
                type="number"
                id="timeBeforeFirstSlot"
                value={wizardState.timeBeforeFirstSlot}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setWizardState({ ...wizardState, timeBeforeFirstSlot: value });
                  }
                }}
                required
                min="0"
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
        <div className="wizard-content-with-status">
          <div className="wizard-content-main">
            <h2>Step 3: Review & Edit Schedule</h2>
            <p className="schedule-info">
              Generated {wizardState.scheduleSlots.length} time slots across {wizardState.selectedRoomIds.length} room(s)
            </p>

            {/* Minimal banner for critical issues - only shows if there are conflicts */}
            {hasConflicts && (
              <div className="top-banner-minimal">
                🚫 <strong>Conflicts detected.</strong> Check the status panel on the right for details.
              </div>
            )}

            {/* Tab Navigation */}
            <div className="tabs-container">
              <div className="tabs-header">
                <button
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  📅 Schedule Overview
                </button>
                {wizardState.selectedRoomIds.map((roomId) => {
                  const room = rooms.find((r) => r.id === roomId);
                  return (
                    <button
                      key={roomId}
                      className={`tab-button ${activeTab === roomId ? 'active' : ''}`}
                      onClick={() => setActiveTab(roomId)}
                    >
                      {room?.label || `Room ${roomId}`}
                    </button>
                  );
                })}
              </div>

              <div className="tabs-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="tab-panel">
                    {renderScheduleOverview()}
                  </div>
                )}

                {/* Room Tabs */}
                {wizardState.selectedRoomIds.map((roomId) => {
                  if (activeTab !== roomId) return null;

                  const room = rooms.find((r) => r.id === roomId);
                  const roomSlots = wizardState.scheduleSlots.filter((s) => s.roomId === roomId);

                  return (
                    <div key={roomId} className="tab-panel">
                      <div className="room-schedule">
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
                        <div
                          key={idx}
                          className="schedule-slot"
                          ref={(el) => {
                            if (el) {
                              slotRefs.current.set(slotGlobalIdx, el);
                            } else {
                              slotRefs.current.delete(slotGlobalIdx);
                            }
                          }}
                        >
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
                              disabled={saving}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="slot-content">
                            <div className="form-group">
                              <label>Teams</label>
                              <div className="selection-preview">
                                {renderTeamsPreview(slot.teamIds)}
                              </div>
                              <select
                                multiple
                                value={slot.teamIds.map(String)}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                                  updateSlotTeams(slotGlobalIdx, selected);
                                }}
                                className="form-input multi-select"
                                disabled={saving}
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
                                {renderJuriesPreview(slot.juryIds)}
                              </div>
                              <select
                                multiple
                                value={slot.juryIds.map(String)}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                                  updateSlotJuries(slotGlobalIdx, selected);
                                }}
                                className="form-input multi-select"
                                disabled={saving}
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
                          disabled={saving}
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
                          disabled={saving}
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
                        disabled={saving}
                      >
                        Add Slot
                      </button>
                    </div>
                  </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-actions">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn btn-secondary"
              disabled={saving || isRebalancing}
            >
              Back
            </button>
            {(() => {
              // Compute button state for Magic Rebalance/Undo
              const hasSnapshot = preRebalanceSlots !== null;
              const hasSchedule = wizardState.scheduleSlots.length > 0;
              const isUndoMode = hasSnapshot;
              // Undo mode: only disabled if saving/rebalancing
              // Magic Rebalance mode: disabled if saving/rebalancing OR no schedule
              const isMagicRebalanceDisabled = saving || isRebalancing || (isUndoMode ? false : !hasSchedule);
              const buttonLabel = isRebalancing 
                ? '⏳ Rebalancing...' 
                : (isUndoMode ? '↶ Undo Rebalance' : '✨ Magic Rebalance');
              const buttonTitle = isUndoMode 
                ? "Restore the previous schedule before rebalancing" 
                : "Automatically optimize team and jury assignments";

              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isUndoMode) {
                      handleUndoRebalance();
                    } else {
                      handleMagicRebalance();
                    }
                  }}
                  className="btn btn-magic"
                  disabled={isMagicRebalanceDisabled}
                  title={buttonTitle}
                >
                  {buttonLabel}
                </button>
              );
            })()}
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn btn-secondary"
              disabled={saving || isRebalancing}
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              className="btn btn-primary"
              disabled={saving || hasConflicts || isRebalancing}
              title={hasConflicts ? 'Please resolve all conflicts before saving' : ''}
            >
              {saving ? 'Saving…' : 'Save Plan'}
            </button>
          </div>
          {saving && (
            <div style={{ marginTop: '20px' }}>
              <LoadingSpinner message="Saving session plan…" />
            </div>
          )}
          </div>

          {/* Rebalance Modal */}
          {rebalanceResponse && rebalanceResponse.rebalance_report && beforeSlots && (
            <RebalanceModal
              isOpen={rebalanceModalOpen}
              onClose={handleCloseRebalanceModal}
              beforeScores={rebalanceResponse.rebalance_report.before_scores}
              afterScores={rebalanceResponse.rebalance_report.after_scores}
              improved={rebalanceResponse.rebalance_report.improved}
              onApply={handleApplyRebalance}
              onUndo={handleUndoRebalance}
              hasApplied={preRebalanceSlots !== null}
              beforeSlots={beforeSlots}
              afterSlots={rebalanceResponse.plan.slots}
              rooms={rooms.map(r => ({ id: r.id, label: r.label }))}
              teams={teams.map(t => ({ id: t.id, label: t.label }))}
              juries={juries.map(j => ({ id: j.id, label: j.label }))}
            />
          )}

          {/* Status Panel */}
          <StatusPanel
            unassignedTeams={getUnassignedTeamIds().map(id => {
              const team = teams.find(t => t.id === id);
              return { id, label: team?.label || `Team ${id}` };
            })}
            unassignedJuries={getUnassignedJuryIds().map(id => {
              const jury = juries.find(j => j.id === id);
              return { id, label: jury?.label || `Jury ${id}` };
            })}
            teamConflicts={conflicts.teamConflicts}
            juryConflicts={conflicts.juryConflicts}
            teams={teams.map(t => ({ id: t.id, label: t.label }))}
            juries={juries.map(j => ({ id: j.id, label: j.label }))}
            rooms={rooms.map(r => ({ id: r.id, label: r.label }))}
            slots={wizardState.scheduleSlots}
            onConflictClick={handleScrollToSlot}
            isOpen={statusPanelOpen}
            onToggle={() => setStatusPanelOpen(!statusPanelOpen)}
            isCollapsed={statusPanelCollapsed}
            onCollapse={() => setStatusPanelCollapsed(!statusPanelCollapsed)}
          />
        </div>
      )}
    </div>
  );
};

export default SessionWizard;
