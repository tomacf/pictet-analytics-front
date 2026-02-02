import { useState, useEffect } from 'react';
import { SessionsService, TeamsService, JuriesService } from '../../apiConfig';
import type { Session, SessionInput, Team, Jury } from '../../api';
import DataTable from '../../components/shared/DataTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import Modal from '../../components/shared/Modal';
import { toast } from 'react-toastify';
import '../teams/Teams.css';

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [juries, setJuries] = useState<Jury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<SessionInput>({
    team_id: 0,
    jury_id: 0,
    start_time: '',
    end_time: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, teamsData, juriesData] = await Promise.all([
        SessionsService.getAllSessions(),
        TeamsService.getAllTeams(),
        JuriesService.getAllJuries(),
      ]);
      setSessions(sessionsData);
      setTeams(teamsData);
      setJuries(juriesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingSession(null);
    setFormData({
      team_id: teams[0]?.id || 0,
      jury_id: juries[0]?.id || 0,
      start_time: '',
      end_time: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      team_id: session.team_id,
      jury_id: session.jury_id,
      start_time: session.start_time,
      end_time: session.end_time,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (session: Session) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await SessionsService.deleteSession(session.id);
      toast.success('Session deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team_id || !formData.jury_id) {
      toast.error('Team and Jury are required');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Start time and end time are required');
      return;
    }

    try {
      if (editingSession) {
        await SessionsService.updateSession({
          ...editingSession,
          ...formData,
        });
        toast.success('Session updated successfully');
      } else {
        await SessionsService.createSession(formData);
        toast.success('Session created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save session');
    }
  };

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || `Team #${teamId}`;
  };

  const getJuryName = (juryId: number) => {
    return juries.find(j => j.id === juryId)?.name || `Jury #${juryId}`;
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'team_id',
      label: 'Team',
      render: (session: Session) => getTeamName(session.team_id),
    },
    {
      key: 'jury_id',
      label: 'Jury',
      render: (session: Session) => getJuryName(session.jury_id),
    },
    {
      key: 'start_time',
      label: 'Start Time',
      render: (session: Session) => new Date(session.start_time).toLocaleString(),
    },
    {
      key: 'end_time',
      label: 'End Time',
      render: (session: Session) => new Date(session.end_time).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Sessions</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Session
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'Edit Session' : 'Create Session'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="team_id">Team *</label>
            <select
              id="team_id"
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="jury_id">Jury *</label>
            <select
              id="jury_id"
              value={formData.jury_id}
              onChange={(e) => setFormData({ ...formData, jury_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select a jury</option>
              {juries.map((jury) => (
                <option key={jury.id} value={jury.id}>
                  {jury.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="start_time">Start Time *</label>
            <input
              type="datetime-local"
              id="start_time"
              value={formData.start_time ? formData.start_time.slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="end_time">End Time *</label>
            <input
              type="datetime-local"
              id="end_time"
              value={formData.end_time ? formData.end_time.slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingSession ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sessions;
