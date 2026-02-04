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
} from 'recharts';
import type { TeamRoomDistribution } from '../../apiConfig';
import './RoomDistributionChart.css';

interface RoomDistributionChartProps {
  data: TeamRoomDistribution[];
}

type ViewMode = 'stacked' | 'table' | 'heatmap';

const RoomDistributionChart = ({ data }: RoomDistributionChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('stacked');

  // Extract all unique rooms
  const allRooms = Array.from(
    new Set(
      data.flatMap((team) => team.room_counts.map((rc) => rc.room_label))
    )
  ).sort();

  // Prepare data for stacked bar chart
  const chartData = data.map((team) => {
    const teamData: any = { name: team.team_label };
    team.room_counts.forEach((rc) => {
      teamData[rc.room_label] = rc.count;
    });
    return teamData;
  });

  // Generate colors for different rooms
  const getColorForRoom = (index: number, total: number) => {
    const hue = (index * 360) / total;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const roomColors = allRooms.reduce((acc, room, index) => {
    acc[room] = getColorForRoom(index, allRooms.length);
    return acc;
  }, {} as Record<string, string>);

  // Calculate max count for heatmap
  const maxCount = Math.max(
    ...data.flatMap((team) => team.room_counts.map((rc) => rc.count))
  );

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#f8fafc';
    const intensity = Math.min(count / maxCount, 1);
    const r = 204;
    const g = Math.floor(45 + (255 - 45) * (1 - intensity));
    const b = Math.floor(29 + (255 - 29) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (data.length === 0) {
    return (
      <div className="chart-empty">
        No room distribution data available.
      </div>
    );
  }

  return (
    <div className="room-distribution-container">
      <div className="view-mode-controls">
        <button
          className={`mode-button ${viewMode === 'stacked' ? 'active' : ''}`}
          onClick={() => setViewMode('stacked')}
        >
          📊 Stacked Chart
        </button>
        <button
          className={`mode-button ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          📋 Table View
        </button>
        <button
          className={`mode-button ${viewMode === 'heatmap' ? 'active' : ''}`}
          onClick={() => setViewMode('heatmap')}
        >
          🔥 Heatmap
        </button>
      </div>

      {viewMode === 'stacked' && (
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
                label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              {allRooms.map((room) => (
                <Bar
                  key={room}
                  dataKey={room}
                  stackId="a"
                  fill={roomColors[room]}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="distribution-table">
            <thead>
              <tr>
                <th>Team</th>
                {allRooms.map((room) => (
                  <th key={room}>{room}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((team) => {
                const total = team.room_counts.reduce((sum, rc) => sum + rc.count, 0);
                return (
                  <tr key={team.team_id}>
                    <td className="team-name">{team.team_label}</td>
                    {allRooms.map((room) => {
                      const roomCount = team.room_counts.find((rc) => rc.room_label === room);
                      return (
                        <td key={room} className="count-cell">
                          {roomCount?.count || 0}
                        </td>
                      );
                    })}
                    <td className="total-cell">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'heatmap' && (
        <div className="heatmap-wrapper">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th className="corner-cell"></th>
                {allRooms.map((room) => (
                  <th key={room} className="room-header">
                    <div className="room-label">{room}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((team) => (
                <tr key={team.team_id}>
                  <th className="team-header">{team.team_label}</th>
                  {allRooms.map((room) => {
                    const roomCount = team.room_counts.find((rc) => rc.room_label === room);
                    const count = roomCount?.count || 0;
                    return (
                      <td
                        key={room}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getHeatmapColor(count),
                          color: count > maxCount / 2 ? 'white' : '#1e293b',
                        }}
                        title={`${team.team_label} - ${room}: ${count} sessions`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="heatmap-legend">
            <span className="legend-label">Session Count:</span>
            <div className="legend-gradient">
              <span>0</span>
              <div
                className="gradient-bar"
                style={{
                  background: `linear-gradient(to right, #f8fafc, rgb(204, 45, 29))`,
                }}
              ></div>
              <span>{maxCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDistributionChart;
