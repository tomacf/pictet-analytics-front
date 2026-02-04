import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TeamWaitingTime } from '../../apiConfig';
import './WaitingTimeChart.css';

interface WaitingTimeChartProps {
  data: TeamWaitingTime[];
}

const WaitingTimeChart = ({ data }: WaitingTimeChartProps) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamWaitingTime | null>(null);

  // Sort data by average waiting time for better visualization
  const sortedData = [...data].sort(
    (a, b) => b.average_waiting_time_minutes - a.average_waiting_time_minutes
  );

  const chartData = sortedData.map((team) => ({
    name: team.team_label,
    average: parseFloat(team.average_waiting_time_minutes.toFixed(2)),
    total: parseFloat(team.total_waiting_time_minutes.toFixed(2)),
    teamData: team,
  }));

  const handleBarClick = (entry: any) => {
    if (selectedTeam?.team_id === entry.teamData.team_id) {
      setSelectedTeam(null);
    } else {
      setSelectedTeam(entry.teamData);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (data.length === 0) {
    return (
      <div className="chart-empty">
        No waiting time data available.
      </div>
    );
  }

  return (
    <div className="waiting-time-chart-container">
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number | undefined) => value ? [formatTime(value), ''] : ['', '']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (value === 'average' ? 'Average Time' : 'Total Time')}
            />
            <Bar
              dataKey="average"
              fill="#cc2d1d"
              onClick={handleBarClick}
              cursor="pointer"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    selectedTeam?.team_id === entry.teamData.team_id
                      ? '#a82417'
                      : '#cc2d1d'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedTeam && (
        <div className="session-breakdown">
          <div className="breakdown-header">
            <h3>{selectedTeam.team_label} - Session Breakdown</h3>
            <button
              className="close-button"
              onClick={() => setSelectedTeam(null)}
              aria-label="Close breakdown"
            >
              ✕
            </button>
          </div>
          <div className="breakdown-stats">
            <div className="stat-item">
              <span className="stat-label">Total Waiting Time:</span>
              <span className="stat-value">
                {formatTime(selectedTeam.total_waiting_time_minutes)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Waiting Time:</span>
              <span className="stat-value">
                {formatTime(selectedTeam.average_waiting_time_minutes)}
              </span>
            </div>
          </div>
          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Session Start</th>
                  <th>First Room Start</th>
                  <th>Waiting Time</th>
                </tr>
              </thead>
              <tbody>
                {selectedTeam.session_breakdown.map((session) => (
                  <tr key={session.session_id}>
                    <td>{session.session_label}</td>
                    <td>{new Date(session.session_start_time).toLocaleString()}</td>
                    <td>{new Date(session.first_room_start_time).toLocaleString()}</td>
                    <td className="waiting-time-cell">
                      {formatTime(session.waiting_time_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingTimeChart;
