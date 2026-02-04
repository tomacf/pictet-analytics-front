import { useState, useMemo } from 'react';
import type { TeamJuryMatrix as TeamJuryMatrixType } from '../../apiConfig';
import './TeamJuryMatrix.css';

interface TeamJuryMatrixProps {
  data: TeamJuryMatrixType;
}

type SortConfig = {
  type: 'team-name' | 'jury-name' | 'team-count' | 'jury-count';
  direction: 'asc' | 'desc';
} | null;

type SortType = 'team-name' | 'jury-name' | 'team-count' | 'jury-count';

type HighlightMode = 'none' | 'team-imbalance' | 'jury-imbalance';

const TeamJuryMatrix = ({ data }: TeamJuryMatrixProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('none');
  const [hoveredCell, setHoveredCell] = useState<{ teamId: number; juryId: number } | null>(null);

  // Process data into a matrix structure
  const { teams, juries, matrix, maxMeetCount, teamTotals, juryTotals } = useMemo(() => {
    const matrixData: Record<number, Record<number, number>> = {};
    
    // Initialize matrix
    data.teams.forEach((team) => {
      matrixData[team.id] = {};
      data.juries.forEach((jury) => {
        matrixData[team.id][jury.id] = 0;
      });
    });

    // Fill matrix with counts
    data.counts.forEach((interaction) => {
      matrixData[interaction.team_id][interaction.jury_id] = interaction.meet_count;
    });

    // Calculate max meet count for color scaling
    let maxCount = 0;
    data.counts.forEach((interaction) => {
      if (interaction.meet_count > maxCount) {
        maxCount = interaction.meet_count;
      }
    });

    // Sort teams and juries based on sort config
    const sortedTeams = [...data.teams];
    const sortedJuries = [...data.juries];

    if (sortConfig) {
      if (sortConfig.type === 'team-name') {
        sortedTeams.sort((a, b) => {
          const comparison = a.label.localeCompare(b.label);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      } else if (sortConfig.type === 'team-count') {
        sortedTeams.sort((a, b) => {
          const aCount = data.per_team_totals[a.id.toString()] || 0;
          const bCount = data.per_team_totals[b.id.toString()] || 0;
          const comparison = aCount - bCount;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      } else if (sortConfig.type === 'jury-name') {
        sortedJuries.sort((a, b) => {
          const comparison = a.label.localeCompare(b.label);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      } else if (sortConfig.type === 'jury-count') {
        sortedJuries.sort((a, b) => {
          const aCount = data.per_jury_totals[a.id.toString()] || 0;
          const bCount = data.per_jury_totals[b.id.toString()] || 0;
          const comparison = aCount - bCount;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }
    }

    return {
      teams: sortedTeams,
      juries: sortedJuries,
      matrix: matrixData,
      maxMeetCount: maxCount,
      teamTotals: data.per_team_totals,
      juryTotals: data.per_jury_totals,
    };
  }, [data, sortConfig]);

  const handleSort = (type: SortType) => {
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

  const getCellColor = (count: number) => {
    if (count === 0) return '#f8fafc';
    const intensity = Math.min(count / maxMeetCount, 1);
    // Use a blue-to-red color scale for team-jury interactions
    const r = Math.floor(45 + (204 - 45) * intensity);
    const g = Math.floor(85 + (45 - 85) * intensity);
    const b = Math.floor(204 + (29 - 204) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getSortIcon = (type: SortType) => {
    if (!sortConfig || sortConfig.type !== type) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Determine if a cell should be highlighted based on imbalance detection
  const shouldHighlight = (teamId: number, juryId: number, count: number): boolean => {
    if (highlightMode === 'none' || count === 0) return false;

    if (highlightMode === 'team-imbalance') {
      // Highlight if this count is above 50% of team's total or above average
      const teamTotal = teamTotals[teamId.toString()] || 0;
      const avgPerJury = teamTotal / juries.length;
      return count >= avgPerJury * 1.5; // 50% above average
    }

    if (highlightMode === 'jury-imbalance') {
      // Highlight if this count is above 50% of jury's total or above average
      const juryTotal = juryTotals[juryId.toString()] || 0;
      const avgPerTeam = juryTotal / teams.length;
      return count >= avgPerTeam * 1.5; // 50% above average
    }

    return false;
  };

  if (teams.length === 0 || juries.length === 0) {
    return (
      <div className="matrix-empty">
        No team-jury interaction data available.
      </div>
    );
  }

  return (
    <div className="jury-matrix-container">
      <div className="matrix-controls">
        <div className="control-group">
          <label>Sort Teams:</label>
          <button
            className="sort-button"
            onClick={() => handleSort('team-name')}
            title="Sort teams by name"
          >
            By Name {getSortIcon('team-name')}
          </button>
          <button
            className="sort-button"
            onClick={() => handleSort('team-count')}
            title="Sort teams by total count"
          >
            By Count {getSortIcon('team-count')}
          </button>
        </div>
        <div className="control-group">
          <label>Sort Juries:</label>
          <button
            className="sort-button"
            onClick={() => handleSort('jury-name')}
            title="Sort juries by name"
          >
            By Name {getSortIcon('jury-name')}
          </button>
          <button
            className="sort-button"
            onClick={() => handleSort('jury-count')}
            title="Sort juries by total count"
          >
            By Count {getSortIcon('jury-count')}
          </button>
        </div>
        <div className="control-group">
          <label>Highlight:</label>
          <button
            className={`highlight-button ${highlightMode === 'team-imbalance' ? 'active' : ''}`}
            onClick={() => setHighlightMode(highlightMode === 'team-imbalance' ? 'none' : 'team-imbalance')}
            title="Highlight teams with concentrated jury exposure (>50% above average)"
          >
            Team Imbalance
          </button>
          <button
            className={`highlight-button ${highlightMode === 'jury-imbalance' ? 'active' : ''}`}
            onClick={() => setHighlightMode(highlightMode === 'jury-imbalance' ? 'none' : 'jury-imbalance')}
            title="Highlight juries over-exposed to certain teams (>50% above average)"
          >
            Jury Imbalance
          </button>
        </div>
      </div>

      <div className="matrix-wrapper">
        <table className="jury-matrix">
          <thead>
            <tr>
              <th className="corner-cell">Team / Jury</th>
              {juries.map((jury) => (
                <th key={jury.id} className="jury-header">
                  <div className="jury-label-vertical">{jury.label}</div>
                </th>
              ))}
              <th className="total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const teamTotal = teamTotals[team.id.toString()] || 0;
              return (
                <tr key={team.id}>
                  <th className="team-header-row">
                    <div className="team-label-horizontal">{team.label}</div>
                  </th>
                  {juries.map((jury) => {
                    const count = matrix[team.id]?.[jury.id] || 0;
                    const isHovered =
                      hoveredCell?.teamId === team.id && hoveredCell?.juryId === jury.id;
                    const isHighlighted = shouldHighlight(team.id, jury.id, count);

                    return (
                      <td
                        key={jury.id}
                        className={`matrix-cell ${isHovered ? 'hovered' : ''} ${
                          isHighlighted ? 'highlighted' : ''
                        }`}
                        style={{
                          backgroundColor: getCellColor(count),
                          color: count > maxMeetCount / 2 ? 'white' : '#1e293b',
                        }}
                        onMouseEnter={() => setHoveredCell({ teamId: team.id, juryId: jury.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${team.label} ↔ ${jury.label}: ${count} sessions`}
                      >
                        {count}
                      </td>
                    );
                  })}
                  <td className="total-cell" title={`Total sessions for ${team.label}`}>
                    {teamTotal}
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <th className="total-header">Total</th>
              {juries.map((jury) => {
                const juryTotal = juryTotals[jury.id.toString()] || 0;
                return (
                  <td key={jury.id} className="total-cell" title={`Total sessions for ${jury.label}`}>
                    {juryTotal}
                  </td>
                );
              })}
              <td className="total-cell grand-total">
                {Object.values(teamTotals).reduce((sum, count) => sum + count, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="matrix-legend">
        <span className="legend-label">Session Count:</span>
        <div className="legend-gradient">
          <span>0</span>
          <div
            className="gradient-bar"
            style={{
              background: `linear-gradient(to right, #f8fafc, rgb(45, 85, 204), rgb(204, 45, 29))`,
            }}
          ></div>
          <span>{maxMeetCount}</span>
        </div>
      </div>

      <div className="matrix-info">
        <p className="info-text">
          <strong>Team Imbalance:</strong> Highlights cells where a team has disproportionately high exposure 
          to a specific jury (≥50% above average).
        </p>
        <p className="info-text">
          <strong>Jury Imbalance:</strong> Highlights cells where a jury is over-exposed to a specific team 
          (≥50% above average).
        </p>
      </div>
    </div>
  );
};

export default TeamJuryMatrix;
