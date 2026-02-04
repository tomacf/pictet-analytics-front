import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { AnalyticsService, type AnalyticsSummary, SessionsService, type Session } from '../../apiConfig';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import TeamVsTeamMatrix from './TeamVsTeamMatrix';
import TeamJuryMatrix from './TeamJuryMatrix';
import WaitingTimeChart from './WaitingTimeChart';
import RoomDistributionChart from './RoomDistributionChart';
import './Analytics.css';

const Analytics = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchSessions = async () => {
    try {
      const sessionsData = await SessionsService.getAllSessions();
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await AnalyticsService.getAnalyticsSummary(
        selectedSessionId,
        startDate || undefined,
        endDate || undefined,
      );
      setData(analyticsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(message);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId, startDate, endDate]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleClearFilters = () => {
    setSelectedSessionId(undefined);
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchAnalytics} />;
  }

  if (!data) {
    return <ErrorDisplay message="No analytics data available" onRetry={fetchAnalytics} />;
  }

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label htmlFor="session-filter">Session:</label>
          <select
            id="session-filter"
            className="form-input"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="start-date-filter">Start Date:</label>
          <input
            id="start-date-filter"
            type="datetime-local"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date-filter">End Date:</label>
          <input
            id="end-date-filter"
            type="datetime-local"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Visualizations */}
      <div className="analytics-content">
        {/* Team vs Jury Matrix */}
        <div className="analytics-section">
          <h2>Team ↔ Jury Interaction Matrix</h2>
          <p className="section-description">
            Shows how many times each team and jury were assigned together in room sessions. 
            Use sorting to identify patterns and highlighting to surface imbalances.
          </p>
          <TeamJuryMatrix data={data.team_jury_matrix} />
        </div>

        {/* Team vs Team Matrix */}
        <div className="analytics-section">
          <h2>Team Interactions Matrix</h2>
          <p className="section-description">
            Shows how many times each pair of teams met in the same room session. 
            Darker colors indicate more meetings.
          </p>
          <TeamVsTeamMatrix data={data.team_vs_team_matrix} />
        </div>

        {/* Waiting Time Chart */}
        <div className="analytics-section">
          <h2>Team Waiting Times</h2>
          <p className="section-description">
            Average waiting time between session start and first room session for each team.
            Click on a bar to see per-session breakdown.
          </p>
          <WaitingTimeChart data={data.team_waiting_times} />
        </div>

        {/* Room Distribution */}
        <div className="analytics-section">
          <h2>Room Distribution by Team</h2>
          <p className="section-description">
            Distribution of room sessions per room for each team.
          </p>
          <RoomDistributionChart data={data.team_room_distributions} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
