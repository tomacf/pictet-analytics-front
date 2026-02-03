import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RoomSessionsService, type RoomSession, type RoomSessionInput, RoomsService, SessionsService, type Room, type Session } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';

const RoomSessions = () => {
  const [roomSessions, setRoomSessions] = useState<RoomSession[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<RoomSessionInput>({
    room_id: 0,
    session_id: 0,
    start_time: '',
    end_time: '',
  });

  const fetchRoomSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomSessionsData, roomsData, sessionsData] = await Promise.all([
        RoomSessionsService.getAllRoomSessions(),
        RoomsService.getAllRooms(),
        SessionsService.getAllSessions(),
      ]);
      setRoomSessions(roomSessionsData);
      setRooms(roomsData);
      setSessions(sessionsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch room sessions';
      setError(message);
      toast.error('Failed to fetch room sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomSessions();
  }, []);

  const handleCreate = () => {
    setFormData({
      room_id: 0,
      session_id: 0,
      start_time: '',
      end_time: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (roomSession: RoomSession) => {
    const room = rooms.find(r => r.id === roomSession.room_id);
    const session = sessions.find(s => s.id === roomSession.session_id);
    const roomLabel = room ? room.label : `ID ${roomSession.room_id}`;
    const sessionLabel = session ? session.label : `ID ${roomSession.session_id}`;
    
    if (!window.confirm(`Are you sure you want to delete room session "${roomLabel} - ${sessionLabel}"?`)) {
      return;
    }

    try {
      await RoomSessionsService.deleteRoomSession(roomSession.id);
      toast.success('Room session deleted successfully');
      fetchRoomSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room session';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await RoomSessionsService.createRoomSession(formData);
      toast.success('Room session created successfully');
      setIsModalOpen(false);
      fetchRoomSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save room session';
      toast.error(message);
    }
  };

  const getRoomLabel = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.label : `ID ${roomId}`;
  };

  const getSessionLabel = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.label : `ID ${sessionId}`;
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'room_id',
      label: 'Room',
      render: (rs: RoomSession) => getRoomLabel(rs.room_id),
    },
    {
      key: 'session_id',
      label: 'Session',
      render: (rs: RoomSession) => getSessionLabel(rs.session_id),
    },
    {
      key: 'start_time',
      label: 'Start Time',
      render: (rs: RoomSession) => new Date(rs.start_time).toLocaleString(),
    },
    {
      key: 'end_time',
      label: 'End Time',
      render: (rs: RoomSession) => new Date(rs.end_time).toLocaleString(),
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (rs: RoomSession) => new Date(rs.created_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchRoomSessions} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Room Sessions</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          Create Room Session
        </button>
      </div>

      <DataTable
        columns={columns}
        data={roomSessions}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Room Session"
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="room_id">Room</label>
            <select
              id="room_id"
              value={formData.room_id || ''}
              onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
              required
              className="form-input"
            >
              <option value="" disabled>Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="session_id">Session</label>
            <select
              id="session_id"
              value={formData.session_id || ''}
              onChange={(e) => setFormData({ ...formData, session_id: parseInt(e.target.value) })}
              required
              className="form-input"
            >
              <option value="" disabled>Select a session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </select>
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
            <label htmlFor="end_time">End Time</label>
            <input
              type="datetime-local"
              id="end_time"
              value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, end_time: new Date(e.target.value).toISOString() })}
              required
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomSessions;
