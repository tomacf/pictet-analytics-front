import type { RebalanceMetrics } from '../../utils/rebalanceUtils';
import './RebalanceModal.css';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeMetrics: RebalanceMetrics;
  afterMetrics: RebalanceMetrics;
  improvementPercentage: number;
  onApply: () => void;
  onUndo: () => void;
  hasApplied: boolean;
}

const RebalanceModal = ({
  isOpen,
  onClose,
  beforeMetrics,
  afterMetrics,
  improvementPercentage,
  onApply,
  onUndo,
  hasApplied,
}: RebalanceModalProps) => {
  if (!isOpen) return null;

  const formatNumber = (num: number) => num.toFixed(2);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content rebalance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Magic Rebalance Results</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="rebalance-summary">
            <div className={`improvement-badge ${improvementPercentage > 0 ? 'positive' : 'neutral'}`}>
              {improvementPercentage > 0 ? (
                <>
                  <span className="improvement-icon">✓</span>
                  <strong>{formatNumber(improvementPercentage)}% improvement</strong>
                </>
              ) : (
                <>
                  <span className="improvement-icon">≈</span>
                  <strong>No significant improvement</strong>
                </>
              )}
            </div>
          </div>

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
                beforeMetrics.waitingTimeDisparity,
                afterMetrics.waitingTimeDisparity,
                ' min'
              )}
              {renderMetricRow(
                'Repeated Team Meetings',
                beforeMetrics.repeatedTeamMeetings,
                afterMetrics.repeatedTeamMeetings
              )}
              {renderMetricRow(
                'Repeated Team-Jury Interactions',
                beforeMetrics.repeatedTeamJuryInteractions,
                afterMetrics.repeatedTeamJuryInteractions
              )}
              {renderMetricRow(
                'Uneven Room Attendance',
                beforeMetrics.unevenRoomAttendance,
                afterMetrics.unevenRoomAttendance
              )}
              {renderMetricRow(
                'Jury Room Changes',
                beforeMetrics.juryRoomChanges,
                afterMetrics.juryRoomChanges
              )}
              <tr className="total-row">
                <td className="metric-label"><strong>Total Penalty Score</strong></td>
                <td className="metric-value"><strong>{formatNumber(beforeMetrics.totalPenalty)}</strong></td>
                <td className="metric-value"><strong>{formatNumber(afterMetrics.totalPenalty)}</strong></td>
                <td className={`metric-change ${afterMetrics.totalPenalty < beforeMetrics.totalPenalty ? 'improvement' : 'degradation'}`}>
                  <strong>
                    {afterMetrics.totalPenalty - beforeMetrics.totalPenalty > 0 ? '+' : ''}
                    {formatNumber(afterMetrics.totalPenalty - beforeMetrics.totalPenalty)}
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
              <li><strong>Waiting Time Disparity:</strong> Variance in wait times between team presentations (lower is better)</li>
              <li><strong>Repeated Team Meetings:</strong> Number of times the same teams meet in different slots</li>
              <li><strong>Repeated Team-Jury Interactions:</strong> Number of times the same team meets the same jury</li>
              <li><strong>Uneven Room Attendance:</strong> Variance in how teams/juries are distributed across rooms</li>
              <li><strong>Jury Room Changes:</strong> Number of times juries change rooms between consecutive slots</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {hasApplied ? (
            <button className="btn btn-warning" onClick={onUndo}>
              ↶ Undo Rebalance
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onApply}>
              ✓ Apply Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RebalanceModal;
