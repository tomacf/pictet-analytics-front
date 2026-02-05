import {useRef} from 'react';
import type {JuryConflict, TeamConflict} from '../../utils/validationUtils';
import './StatusPanel.css';

interface RoomJuryAssignment {
  roomId: number;
  juryIds: number[];
}

interface StatusPanelProps {
  unassignedTeams: Array<{ id: number; label: string }>;
  unassignedJuries: Array<{ id: number; label: string }>;
  teamConflicts: TeamConflict[];
  juryConflicts: JuryConflict[];
  slotsMissingJuries?: Array<{
    roomId: number;
    slotIndex: number;
    startTime: string;
    endTime: string;
  }>;
  // Room-level jury assignments for display
  roomJuryAssignments?: RoomJuryAssignment[];
  // Rooms that are missing juries (room-level)
  roomsMissingJuries?: number[];
  teams: Array<{ id: number; label: string }>;
  juries: Array<{ id: number; label: string }>;
  rooms: Array<{ id: number; label: string }>;
  slots: Array<{
    roomId: number;
    slotIndex: number;
    startTime: string;
    endTime: string;
  }>;
  onConflictClick?: (slotIndex: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

const StatusPanel = ({
  unassignedTeams,
  unassignedJuries,
  teamConflicts,
  juryConflicts,
  slotsMissingJuries = [],
  roomJuryAssignments = [],
  roomsMissingJuries = [],
  teams,
  juries,
  rooms,
  slots,
  onConflictClick,
  isOpen = true,
  onToggle,
  isCollapsed = false,
  onCollapse,
}: StatusPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const hasUnassigned = unassignedTeams.length > 0 || unassignedJuries.length > 0;
  const hasConflicts = teamConflicts.length > 0 || juryConflicts.length > 0;
  const hasMissingJuries = slotsMissingJuries.length > 0 || roomsMissingJuries.length > 0;
  const hasRoomAssignments = roomJuryAssignments.length > 0;
  const hasIssues = hasUnassigned || hasConflicts || hasMissingJuries;
  const hasWarnings = hasUnassigned || hasMissingJuries;
  const hasErrors = hasConflicts;

  // Get slot description for conflicts
  const getSlotDescription = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot) return `Slot ${slotIndex + 1}`;

    const room = rooms.find((r) => r.id === slot.roomId);
    const startTime = new Date(slot.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(slot.endTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${room?.label || `Room ${slot.roomId}`} - Slot ${slot.slotIndex + 1} (${startTime}-${endTime})`;
  };

  // Handle clicking on a conflict to scroll to the slot
  const handleConflictClick = (slotIndex: number) => {
    if (onConflictClick) {
      onConflictClick(slotIndex);
    }
  };

  return (
    <>
      {/* Right Sidebar Container - for sticky positioning */}
      <div className="status-panel-wrapper">
        {/* Desktop Collapse Toggle Button */}
        {onCollapse && (
          <button
            className={`status-panel-collapse-toggle ${isCollapsed ? 'collapsed' : ''}`}
            onClick={onCollapse}
            aria-label={isCollapsed ? "Expand status panel" : "Collapse status panel"}
            title={isCollapsed ? "Expand status panel" : "Collapse status panel"}
          >
            {isCollapsed ? (
              <>
                <span className="collapse-arrow">›</span>
                {hasWarnings && <span className="collapse-icon warning-icon">⚠</span>}
                {hasErrors && <span className="collapse-icon error-icon">🚫</span>}
              </>
            ) : (
              <span className="collapse-arrow">›</span>
            )}
          </button>
        )}

        {/* Status Panel */}
        <div
          ref={panelRef}
          className={`status-panel ${isOpen ? 'status-panel-open' : 'status-panel-closed'} ${isCollapsed ? 'status-panel-collapsed' : ''}`}
        >
        <div className="status-panel-header">
          <h3>Status</h3>
          <button
            className="status-panel-close"
            onClick={onToggle}
            aria-label="Close status panel"
          >
            ✕
          </button>
        </div>

        <div className="status-panel-content">
          {!hasIssues && (
            <div className="status-section status-success">
              <div className="status-section-header">
                <span className="status-icon">✓</span>
                <h4>All Good!</h4>
              </div>
              <p className="status-message">No issues detected. Ready to save.</p>
            </div>
          )}

          {/* Unassigned Teams */}
          {unassignedTeams.length > 0 && (
            <div className="status-section status-warning">
              <div className="status-section-header">
                <span className="status-icon">⚠</span>
                <h4>Unassigned Teams ({unassignedTeams.length})</h4>
              </div>
              <p className="status-description">These teams are not assigned to any slot:</p>
              <div className="status-chips">
                {unassignedTeams.map((team) => (
                  <span key={team.id} className="status-chip status-chip-warning">
                    {team.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned Juries */}
          {unassignedJuries.length > 0 && (
            <div className="status-section status-warning">
              <div className="status-section-header">
                <span className="status-icon">⚠</span>
                <h4>Unassigned Juries ({unassignedJuries.length})</h4>
              </div>
              <p className="status-description">These juries are not assigned to any room:</p>
              <div className="status-chips">
                {unassignedJuries.map((jury) => (
                  <span key={jury.id} className="status-chip status-chip-warning">
                    {jury.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Room Assignments Section */}
          {hasRoomAssignments && (
            <div className="status-section status-info">
              <div className="status-section-header">
                <span className="status-icon">🏠</span>
                <h4>Room Assignments</h4>
              </div>
              <div className="room-assignments-list">
                {roomJuryAssignments.map((assignment) => {
                  const room = rooms.find((r) => r.id === assignment.roomId);
                  const assignedJuries = assignment.juryIds
                    .map(juryId => juries.find((j) => j.id === juryId))
                    .filter((jury): jury is { id: number; label: string } => jury !== undefined);
                  const isMissing = assignment.juryIds.length === 0;
                  
                  return (
                    <div 
                      key={assignment.roomId} 
                      className={`room-assignment-item ${isMissing ? 'missing' : ''}`}
                    >
                      <span className="room-name">{room?.label || `Room ${assignment.roomId}`}</span>
                      <span className="assignment-arrow">→</span>
                      {assignedJuries.length > 0 ? (
                        <span className="jury-name">{assignedJuries.map(j => j.label).join(', ')}</span>
                      ) : (
                        <span className="jury-unassigned">
                          Unassigned <span className="warning-badge">⚠</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rooms Missing Juries */}
          {roomsMissingJuries.length > 0 && (
            <div className="status-section status-warning">
              <div className="status-section-header">
                <span className="status-icon">⚠</span>
                <h4>Rooms Missing Juries ({roomsMissingJuries.length})</h4>
              </div>
              <p className="status-description">These rooms have no jury assigned:</p>
              <div className="status-chips">
                {roomsMissingJuries.map((roomId) => {
                  const room = rooms.find((r) => r.id === roomId);
                  return (
                    <span key={roomId} className="status-chip status-chip-warning">
                      {room?.label || `Room ${roomId}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Conflicts */}
          {teamConflicts.length > 0 && (
            <div className="status-section status-error">
              <div className="status-section-header">
                <span className="status-icon">🚫</span>
                <h4>Team Conflicts ({teamConflicts.length})</h4>
              </div>
              <p className="status-description">Teams assigned to multiple slots:</p>
              <div className="conflicts-list">
                {teamConflicts.map((conflict) => {
                  const team = teams.find((t) => t.id === conflict.teamId);
                  return (
                    <div key={conflict.teamId} className="conflict-item">
                      <div className="conflict-title">
                        <strong>{team?.label || `Team ${conflict.teamId}`}</strong>
                      </div>
                      <div className="conflict-slots">
                        {conflict.slotIndexes.map((slotIndex) => (
                          <button
                            key={slotIndex}
                            className="conflict-slot-link"
                            onClick={() => handleConflictClick(slotIndex)}
                            title="Click to scroll to this slot"
                          >
                            {getSlotDescription(slotIndex)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jury Conflicts */}
          {juryConflicts.length > 0 && (
            <div className="status-section status-error">
              <div className="status-section-header">
                <span className="status-icon">🚫</span>
                <h4>Jury Conflicts ({juryConflicts.length})</h4>
              </div>
              <p className="status-description">Juries with overlapping time slots:</p>
              <div className="conflicts-list">
                {juryConflicts.map((conflict) => {
                  const jury = juries.find((j) => j.id === conflict.juryId);
                  return (
                    <div key={conflict.juryId} className="conflict-item">
                      <div className="conflict-title">
                        <strong>{jury?.label || `Jury ${conflict.juryId}`}</strong>
                      </div>
                      <div className="conflict-slots">
                        {conflict.conflictingSlots.map((cs) => (
                          <button
                            key={cs.slotIndex}
                            className="conflict-slot-link"
                            onClick={() => handleConflictClick(cs.slotIndex)}
                            title="Click to scroll to this slot"
                          >
                            {getSlotDescription(cs.slotIndex)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="status-panel-overlay"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default StatusPanel;
