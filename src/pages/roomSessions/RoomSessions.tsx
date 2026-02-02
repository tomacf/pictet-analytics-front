import { useState, useEffect } from 'react';
import { RoomSessionsService, RoomsService, SessionsService } from '../../apiConfig';
import type { RoomSession, RoomSessionInput, Room, Session } from '../../api';
import DataTable from '../../components/shared/DataTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import Modal from '../../components/shared/Modal';
import { toast } from 'react-toastify';
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
  });

  const fetchData = async () => {
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
    setFormData({
      room_id: rooms[0]?.id || 0,
      session_id: sessions[0]?.id || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (roomSession: RoomSession) => {
    if (!window.confirm('Are you sure you want to delete this room session?')) {
      return;
    }

    try {
      await RoomSessionsService.deleteRoomSession(roomSession.id);
      toast.success('Room session deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete room session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.room_id || !formData.session_id) {
      toast.error('Room and Session are required');
      return;
    }

    try {
      await RoomSessionsService.createRoomSession(formData);
      toast.success('Room session created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save room session');
    }
  };

  const getRoomName = (roomId: number) => {
    return rooms.find(r => r.id === roomId)?.name || `Room #${roomId}`;
  };

  const getSessionInfo = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return `Session #${sessionId}`;
    return `Session #${session.id} (${new Date(session.start_time).toLocaleString()})`;
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'room_id',
      label: 'Room',
      render: (rs: RoomSession) => getRoomName(rs.room_id),
    },
    {
      key: 'session_id',
      label: 'Session',
      render: (rs: RoomSession) => getSessionInfo(rs.session_id),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (rs: RoomSession) => new Date(rs.created_at).toLocaleString(),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Room Sessions</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Room Session
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
            <label htmlFor="room_id">Room *</label>
            <select
              id="room_id"
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="session_id">Session *</label>
            <select
              id="session_id"
              value={formData.session_id}
              onChange={(e) => setFormData({ ...formData, session_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select a session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Session #{session.id} ({new Date(session.start_time).toLocaleString()})
                </option>
              ))}
            </select>
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
