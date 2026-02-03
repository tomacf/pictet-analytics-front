import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SessionsService, type Session, type SessionInput } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';

const Sessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<SessionInput>({
    label: '',
    start_time: '',
    slot_duration: 0,
    time_between_slots: 0,
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SessionsService.getAllSessions();
      setSessions(data);
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

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      label: session.label,
      start_time: session.start_time,
      slot_duration: session.slot_duration,
      time_between_slots: session.time_between_slots,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (session: Session) => {
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
        await SessionsService.updateSession({ ...editingSession, ...formData });
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
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    {
      key: 'start_time',
      label: 'Start Time',
      render: (session: Session) => new Date(session.start_time).toLocaleString(),
    },
    { key: 'slot_duration', label: 'Slot Duration (min)' },
    { key: 'time_between_slots', label: 'Time Between Slots (min)' },
    {
      key: 'created_at',
      label: 'Created At',
      render: (session: Session) => new Date(session.created_at).toLocaleString(),
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
