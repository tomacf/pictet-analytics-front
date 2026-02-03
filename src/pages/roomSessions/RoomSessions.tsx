import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { RoomSessionsService, type RoomSessionExpanded, type RoomSessionInput, RoomsService, SessionsService, type Room, type Session } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';
import './RoomSessions.css';

const RoomSessions = () => {
  const [roomSessions, setRoomSessions] = useState<RoomSessionExpanded[]>([]);
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

  // Filter states
  const [filterSession, setFilterSession] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchRoomSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomSessionsData, roomsData, sessionsData] = await Promise.all([
        RoomSessionsService.getAllRoomSessions('session,room,teams,juries'),
        RoomsService.getAllRooms(),
        SessionsService.getAllSessions(),
      ]);
      setRoomSessions(roomSessionsData as RoomSessionExpanded[]);
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

  const handleDelete = async (roomSession: RoomSessionExpanded) => {
    const roomLabel = roomSession.room ? roomSession.room.label : `ID ${roomSession.room_id}`;
    const sessionLabel = roomSession.session ? roomSession.session.label : `ID ${roomSession.session_id}`;
    
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

  // Filter and sort room sessions
  const filteredAndSortedRoomSessions = useMemo(() => {
    let filtered = [...roomSessions];

    // Apply session filter
    if (filterSession) {
      filtered = filtered.filter(rs => 
        rs.session?.label.toLowerCase().includes(filterSession.toLowerCase()) ||
        `ID ${rs.session_id}`.toLowerCase().includes(filterSession.toLowerCase())
      );
    }

    // Apply room filter
    if (filterRoom) {
      filtered = filtered.filter(rs => 
        rs.room?.label.toLowerCase().includes(filterRoom.toLowerCase()) ||
        `ID ${rs.room_id}`.toLowerCase().includes(filterRoom.toLowerCase())
      );
    }

    // Apply date filter (checks if start_time matches the selected date)
    if (filterDate) {
      filtered = filtered.filter(rs => {
        const startDate = new Date(rs.start_time).toISOString().split('T')[0];
        return startDate === filterDate;
      });
    }

    // Sort by start_time
    filtered.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }, [roomSessions, filterSession, filterRoom, filterDate, sortOrder]);

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'session',
      label: 'Session',
      render: (rs: RoomSessionExpanded) => rs.session?.label || `ID ${rs.session_id}`,
    },
    {
      key: 'room',
      label: 'Room',
      render: (rs: RoomSessionExpanded) => rs.room?.label || `ID ${rs.room_id}`,
    },
    {
      key: 'teams',
      label: 'Teams',
      render: (rs: RoomSessionExpanded) => (
        <div className="chips-container">
          {rs.teams && rs.teams.length > 0 ? (
            rs.teams.map((team) => (
              <span key={team.id} className="chip chip-team">
                {team.label}
              </span>
            ))
          ) : (
            <span className="no-data-text">No teams</span>
          )}
        </div>
      ),
    },
    {
      key: 'juries',
      label: 'Juries',
      render: (rs: RoomSessionExpanded) => (
        <div className="chips-container">
          {rs.juries && rs.juries.length > 0 ? (
            rs.juries.map((jury) => (
              <span key={jury.id} className="chip chip-jury">
                {jury.label}
              </span>
            ))
          ) : (
            <span className="no-data-text">No juries</span>
          )}
        </div>
      ),
    },
    {
      key: 'start_time',
      label: 'Start Time',
      render: (rs: RoomSessionExpanded) => new Date(rs.start_time).toLocaleString(),
    },
    {
      key: 'end_time',
      label: 'End Time',
      render: (rs: RoomSessionExpanded) => new Date(rs.end_time).toLocaleString(),
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

      {/* Filters section */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="filter-session">Filter by Session</label>
          <input
            type="text"
            id="filter-session"
            placeholder="Search session..."
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-room">Filter by Room</label>
          <input
            type="text"
            id="filter-room"
            placeholder="Search room..."
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-date">Filter by Date</label>
          <input
            type="date"
            id="filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort-order">Sort by Start Time</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="form-input"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAndSortedRoomSessions}
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
