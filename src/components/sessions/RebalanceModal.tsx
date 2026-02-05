import type {IDLabel, RebalanceScores, RoomSessionExpanded, SessionPlanSlot} from '../../apiConfig';
import Modal from '../shared/Modal';
import './RebalanceModal.css';
import ScheduleOverview from './ScheduleOverview';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeScores: RebalanceScores;
  afterScores: RebalanceScores;
  improved: boolean;
  onApply: () => void;
  onUndo: () => void;
  hasApplied: boolean;
  beforeSlots: SessionPlanSlot[];
  afterSlots: SessionPlanSlot[];
  rooms: Array<{ id: number; label: string }>;
  teams: Array<{ id: number; label: string }>;
  juries: Array<{ id: number; label: string }>;
}

const METRIC_DECIMAL_PLACES = 2; // Number of decimal places to show for metrics

const RebalanceModal = ({
  isOpen,
  onClose,
  beforeScores,
  afterScores,
  improved,
  onApply,
  onUndo,
  hasApplied,
  beforeSlots,
  afterSlots,
  rooms,
  teams,
  juries,
}: RebalanceModalProps) => {
  if (!isOpen) return null;

  const formatNumber = (num: number) => num.toFixed(METRIC_DECIMAL_PLACES);

  // Helper function to get or create IDLabel
  const getOrCreateIDLabel = (
    map: Map<number, { id: number; label: string }>,
    id: number,
    prefix: string
  ): IDLabel => {
    const entity = map.get(id);
    return entity ? { id: entity.id, label: entity.label } : { id, label: `${prefix} ${id}` };
  };

  // Convert SessionPlanSlot[] to RoomSessionExpanded[] for ScheduleOverview
  const convertSlotsToRoomSessions = (slots: SessionPlanSlot[]): RoomSessionExpanded[] => {
    // Create lookup maps for O(1) access instead of O(n) find operations
    const roomsMap = new Map(rooms.map(r => [r.id, r]));
    const teamsMap = new Map(teams.map(t => [t.id, t]));
    const juriesMap = new Map(juries.map(j => [j.id, j]));

    // Filter out slots with invalid data
    const validSlots = slots.filter(slot =>
      slot &&
      slot.room_id != null &&
      slot.start_time &&
      slot.end_time &&
      slot.team_ids &&
      slot.jury_ids &&
      slot.team_ids.length > 0 &&
      slot.jury_ids.length > 0
    );
    return validSlots.map((slot, index) => {
      const room = roomsMap.get(slot.room_id);
      const slotTeams = slot.team_ids.map(id => getOrCreateIDLabel(teamsMap, id, 'Team'));
      const slotJuries = slot.jury_ids.map(id => getOrCreateIDLabel(juriesMap, id, 'Jury'));

      return {
        id: index,
        room_id: slot.room_id,
        session_id: 0, // Placeholder: not needed for preview display
        start_time: slot.start_time,
        end_time: slot.end_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        room: room ? { id: room.id, label: room.label } as IDLabel : undefined,
        teams: slotTeams,
        juries: slotJuries,
      };
    });
  };

  const beforeRoomSessions = convertSlotsToRoomSessions(beforeSlots);
  const afterRoomSessions = convertSlotsToRoomSessions(afterSlots);

  const renderMetricRow = (label: string, before: number, after: number, unit: string = '') => {
    const change = after - before;
    const isImprovement = change < 0;
    const changePercent = before > 0 ? ((change / before) * 100) : 0;

    return (
      <tr>
        <td className="metric-label">{label}</td>
        <td className="metric-value">{formatNumber(before)}{unit}</td>
        <td className="metric-value">{formatNumber(after)}{unit}</td>
        <td className={`metric-change ${isImprovement ? 'improvement' : 'degradation'}`}>
          {change > 0 ? '+' : ''}{formatNumber(change)}{unit}
          {before > 0 && (
            <span className="change-percent">
              ({changePercent > 0 ? '+' : ''}{formatNumber(changePercent)}%)
            </span>
          )}
        </td>
      </tr>
    );
  };

  const subtitle = improved
    ? `Schedule improved! Total penalty reduced from ${formatNumber(beforeScores.total_penalty)} to ${formatNumber(afterScores.total_penalty)}`
    : 'No significant improvement detected';

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
      {hasApplied ? (
        <button className="btn btn-warning" onClick={onUndo}>
          ↶ Undo Rebalance
        </button>
      ) : (
        <button className="btn btn-primary" onClick={onApply}>
          ✓ Apply rebalanced plan
        </button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ Magic Rebalance Results"
      subtitle={subtitle}
      footer={modalFooter}
      className="modal-rebalance-wide"
    >
      <div className="rebalance-modal-content">
        <div className="rebalance-summary">
          <div className={`improvement-badge ${improved ? 'positive' : 'neutral'}`}>
            {improved ? (
              <>
                <span className="improvement-icon">✓</span>
                <strong>Schedule improved!</strong>
              </>
            ) : (
              <>
                <span className="improvement-icon">≈</span>
                <strong>No significant improvement</strong>
              </>
            )}
          </div>
        </div>

        {/* Schedule Preview Section */}
        <div className="schedule-preview-section">
          <div className="schedule-preview-container">
            <div className="schedule-preview-column">
              <h3 className="schedule-preview-title">Before</h3>
              <div className="schedule-preview-content">
                <ScheduleOverview roomSessions={beforeRoomSessions} rooms={rooms} />
              </div>
            </div>
            <div className="schedule-preview-column">
              <h3 className="schedule-preview-title">After</h3>
              <div className="schedule-preview-content">
                <ScheduleOverview roomSessions={afterRoomSessions} rooms={rooms} />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Table */}
        <table className="metrics-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Before</th>
                <th>After</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {renderMetricRow(
                'Waiting Time Disparity',
                beforeScores.wait_disparity,
                afterScores.wait_disparity
              )}
              {renderMetricRow(
                'Meeting Repeats',
                beforeScores.meeting_repeats,
                afterScores.meeting_repeats
              )}
              {renderMetricRow(
                'Team-Jury Repeats',
                beforeScores.team_jury_repeats,
                afterScores.team_jury_repeats
              )}
              {renderMetricRow(
                'Room Diversity',
                beforeScores.room_diversity,
                afterScores.room_diversity
              )}
              <tr className="total-row">
                <td className="metric-label"><strong>Total Penalty Score</strong></td>
                <td className="metric-value"><strong>{formatNumber(beforeScores.total_penalty)}</strong></td>
                <td className="metric-value"><strong>{formatNumber(afterScores.total_penalty)}</strong></td>
                <td className={`metric-change ${afterScores.total_penalty < beforeScores.total_penalty ? 'improvement' : 'degradation'}`}>
                  <strong>
                    {afterScores.total_penalty - beforeScores.total_penalty > 0 ? '+' : ''}
                    {formatNumber(afterScores.total_penalty - beforeScores.total_penalty)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="rebalance-info">
            <p>
              <strong>What does this mean?</strong>
            </p>
            <ul>
              <li><strong>Waiting Time Disparity:</strong> Variance in wait times (lower is better)</li>
              <li><strong>Meeting Repeats:</strong> Team-vs-team history for grouped slots</li>
              <li><strong>Team-Jury Repeats:</strong> Team-jury meeting history</li>
              <li><strong>Room Diversity:</strong> Penalty for frequently-used rooms</li>
            </ul>
          </div>
        </div>
      </Modal>
    );
};

export default RebalanceModal;
