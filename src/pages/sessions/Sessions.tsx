import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SessionsService, type SessionExpanded, type SessionInput } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import { formatEuropeanDateTime } from '../../utils/dateUtils';
import './Sessions.css';
import '../teams/Teams.css';
import '../roomSessions/RoomSessions.css';

const Sessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionExpanded | null>(null);
  const [formData, setFormData] = useState<SessionInput>({
    label: '',
    start_time: '',
    slot_duration: 0,
    time_between_slots: 0,
  });

  // Maximum number of visible chips before showing "+N more"
  const MAX_VISIBLE_CHIPS = 4;

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SessionsService.getAllSessions('teams,juries,rooms,summary');
      setSessions(data as SessionExpanded[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(message);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = () => {
    setEditingSession(null);
    setFormData({
      label: '',
      start_time: '',
      slot_duration: 0,
      time_between_slots: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (session: SessionExpanded) => {
    setEditingSession(session);
    setFormData({
      label: session.label,
      start_time: session.start_time,
      slot_duration: session.slot_duration,
      time_between_slots: session.time_between_slots,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (session: SessionExpanded) => {
    if (!window.confirm(`Are you sure you want to delete "${session.label}"?`)) {
      return;
    }

    try {
      await SessionsService.deleteSession(session.id);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSession) {
        await SessionsService.updateSession(editingSession.id, formData);
        toast.success('Session updated successfully');
      } else {
        await SessionsService.createSession(formData);
        toast.success('Session created successfully');
      }
      setIsModalOpen(false);
      fetchSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save session';
      toast.error(message);
    }
  };

  const columns = [
    { 
      key: 'label', 
      label: 'Label',
      render: (session: SessionExpanded) => (
        <button 
          onClick={() => navigate(`/sessions/${session.id}`)}
          className="btn-link"
          style={{ fontSize: '1rem', fontWeight: '500' }}
        >
          {session.label}
        </button>
      ),
    },
    {
      key: 'time_window',
      label: 'Time Window',
      render: (session: SessionExpanded) => {
        const start = formatEuropeanDateTime(session.start_time);
        const end = session.last_room_session_end_time 
          ? formatEuropeanDateTime(session.last_room_session_end_time)
          : null;
        
        if (start && end) {
          return <span style={{ whiteSpace: 'nowrap' }}>{start} → {end}</span>;
        } else if (start) {
          return <span style={{ whiteSpace: 'nowrap' }}>{start}</span>;
        }
        return <span className="no-data-text">—</span>;
      },
    },
    {
      key: 'teams',
      label: 'Teams',
      render: (session: SessionExpanded) => {
        if (!session.teams || session.teams.length === 0) {
          return <span className="no-data-text">—</span>;
        }
        
        const visibleTeams = session.teams.slice(0, MAX_VISIBLE_CHIPS);
        const remainingCount = session.teams.length - MAX_VISIBLE_CHIPS;
        
        return (
          <div className="chips-container-compact">
            {visibleTeams.map(team => (
              <span key={team.id} className="chip chip-team">
                {team.label}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="chip chip-more">+{remainingCount} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'juries',
      label: 'Juries',
      render: (session: SessionExpanded) => {
        if (!session.juries || session.juries.length === 0) {
          return <span className="no-data-text">—</span>;
        }
        
        const visibleJuries = session.juries.slice(0, MAX_VISIBLE_CHIPS);
        const remainingCount = session.juries.length - MAX_VISIBLE_CHIPS;
        
        return (
          <div className="chips-container-compact">
            {visibleJuries.map(jury => (
              <span key={jury.id} className="chip chip-jury">
                {jury.label}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="chip chip-more">+{remainingCount} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'room_sessions_count',
      label: 'Room Sessions',
      render: (session: SessionExpanded) => {
        return session.room_sessions_count !== undefined ? session.room_sessions_count : <span className="no-data-text">—</span>;
      },
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchSessions} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Sessions</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/sessions/wizard')} className="btn btn-primary">
            Scheduling Wizard
          </button>
          <button onClick={handleCreate} className="btn btn-primary">
            Create Session
          </button>
        </div>
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
            <label htmlFor="label">Label</label>
            <input
              type="text"
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="start_time">Start Time</label>
            <input
              type="datetime-local"
              id="start_time"
              value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, start_time: new Date(e.target.value).toISOString() })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slot_duration">Slot Duration (minutes)</label>
            <input
              type="number"
              id="slot_duration"
              value={formData.slot_duration}
              onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
              required
              min="1"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="time_between_slots">Time Between Slots (minutes)</label>
            <input
              type="number"
              id="time_between_slots"
              value={formData.time_between_slots}
              onChange={(e) => setFormData({ ...formData, time_between_slots: parseInt(e.target.value) })}
              required
              min="0"
              className="form-input"
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
