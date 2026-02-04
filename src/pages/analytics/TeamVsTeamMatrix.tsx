import { useState, useMemo } from 'react';
import type { TeamPairMeeting } from '../../apiConfig';
import './TeamVsTeamMatrix.css';

interface TeamVsTeamMatrixProps {
  data: TeamPairMeeting[];
}

type SortConfig = {
  type: 'label' | 'value';
  direction: 'asc' | 'desc';
} | null;

const TeamVsTeamMatrix = ({ data }: TeamVsTeamMatrixProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [hoveredCell, setHoveredCell] = useState<{ team1: string; team2: string } | null>(null);

  // Extract unique teams and create matrix structure
  const { teams, matrix, maxMeetCount } = useMemo(() => {
    const teamSet = new Set<string>();
    const matrixData: Record<string, Record<string, number>> = {};

    data.forEach((meeting) => {
      teamSet.add(meeting.team1_label);
      teamSet.add(meeting.team2_label);

      if (!matrixData[meeting.team1_label]) {
        matrixData[meeting.team1_label] = {};
      }
      if (!matrixData[meeting.team2_label]) {
        matrixData[meeting.team2_label] = {};
      }

      matrixData[meeting.team1_label][meeting.team2_label] = meeting.meet_count;
      matrixData[meeting.team2_label][meeting.team1_label] = meeting.meet_count;
    });

    const teamsList = Array.from(teamSet);
    let maxCount = 0;

    // Calculate max meet count for color scaling
    data.forEach((meeting) => {
      if (meeting.meet_count > maxCount) {
        maxCount = meeting.meet_count;
      }
    });

    // Apply sorting
    if (sortConfig) {
      if (sortConfig.type === 'label') {
        teamsList.sort((a, b) => {
          const comparison = a.localeCompare(b);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      } else if (sortConfig.type === 'value') {
        teamsList.sort((a, b) => {
          // Sum up all meetings for each team
          const aSum = teamsList.reduce((sum, team) => sum + (matrixData[a]?.[team] || 0), 0);
          const bSum = teamsList.reduce((sum, team) => sum + (matrixData[b]?.[team] || 0), 0);
          const comparison = aSum - bSum;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }
    }

    return { teams: teamsList, matrix: matrixData, maxMeetCount: maxCount };
  }, [data, sortConfig]);

  const handleSort = (type: 'label' | 'value') => {
    setSortConfig((current) => {
      if (!current || current.type !== type) {
        return { type, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { type, direction: 'desc' };
      }
      return null;
    });
  };

  const getCellColor = (count: number | undefined) => {
    if (!count || count === 0) return '#f8fafc';
    const intensity = Math.min(count / maxMeetCount, 1);
    // Use a red color scale matching the brand color
    const r = 204;
    const g = Math.floor(45 + (255 - 45) * (1 - intensity));
    const b = Math.floor(29 + (255 - 29) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getSortIcon = (type: 'label' | 'value') => {
    if (!sortConfig || sortConfig.type !== type) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (teams.length === 0) {
    return (
      <div className="matrix-empty">
        No team interaction data available.
      </div>
    );
  }

  return (
    <div className="matrix-container">
      <div className="matrix-controls">
        <button
          className="sort-button"
          onClick={() => handleSort('label')}
          title="Sort by team name"
        >
          Sort by Name {getSortIcon('label')}
        </button>
        <button
          className="sort-button"
          onClick={() => handleSort('value')}
          title="Sort by meeting count"
        >
          Sort by Count {getSortIcon('value')}
        </button>
      </div>

      <div className="matrix-wrapper">
        <table className="team-matrix">
          <thead>
            <tr>
              <th className="corner-cell"></th>
              {teams.map((team) => (
                <th key={team} className="team-header">
                  <div className="team-label-vertical">{team}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((rowTeam) => (
              <tr key={rowTeam}>
                <th className="team-header-row">
                  <div className="team-label-horizontal">{rowTeam}</div>
                </th>
                {teams.map((colTeam) => {
                  const count = matrix[rowTeam]?.[colTeam];
                  const isHovered =
                    hoveredCell?.team1 === rowTeam && hoveredCell?.team2 === colTeam;
                  const isDiagonal = rowTeam === colTeam;

                  return (
                    <td
                      key={colTeam}
                      className={`matrix-cell ${isDiagonal ? 'diagonal' : ''} ${
                        isHovered ? 'hovered' : ''
                      }`}
                      style={{
                        backgroundColor: isDiagonal ? '#e2e8f0' : getCellColor(count),
                        color: count && count > maxMeetCount / 2 ? 'white' : '#1e293b',
                      }}
                      onMouseEnter={() => setHoveredCell({ team1: rowTeam, team2: colTeam })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={
                        isDiagonal
                          ? `${rowTeam} (same team)`
                          : `${rowTeam} ↔ ${colTeam}: ${count || 0} meetings`
                      }
                    >
                      {isDiagonal ? '-' : count || 0}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-legend">
        <span className="legend-label">Meeting Count:</span>
        <div className="legend-gradient">
          <span>0</span>
          <div
            className="gradient-bar"
            style={{
              background: `linear-gradient(to right, #f8fafc, rgb(204, 45, 29))`,
            }}
          ></div>
          <span>{maxMeetCount}</span>
        </div>
      </div>
    </div>
  );
};

export default TeamVsTeamMatrix;
