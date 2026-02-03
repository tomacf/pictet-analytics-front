import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SessionsService, type SessionExpanded, type RoomSessionExpanded } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import '../teams/Teams.css';
import '../roomSessions/RoomSessions.css';
import './SessionDetail.css';

interface RoomSessionFormData {
  room_id: number;
  start_time: string;
  end_time: string;
  team_ids: number[];
  jury_ids: number[];
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionExpanded | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomSession, setEditingRoomSession] = useState<RoomSessionExpanded | null>(null);
  const [formData, setFormData] = useState<RoomSessionFormData>({
    room_id: 0,
    start_time: '',
    end_time: '',
    team_ids: [],
    jury_ids: [],
  });

  const fetchSessionDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await SessionsService.getSessionById(
        parseInt(id),
        'teams,juries,rooms,room_sessions'
      );
      setSession(data as SessionExpanded);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session details';
      setError(message);
      toast.error('Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreateRoomSession = () => {
    setEditingRoomSession(null);
    setFormData({
      room_id: 0,
      start_time: '',
      end_time: '',
      team_ids: [],
      jury_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleEditRoomSession = (roomSession: RoomSessionExpanded) => {
    setEditingRoomSession(roomSession);
    setFormData({
      room_id: roomSession.room_id,
      start_time: roomSession.start_time,
      end_time: roomSession.end_time,
      team_ids: roomSession.teams?.map(t => t.id) || [],
      jury_ids: roomSession.juries?.map(j => j.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteRoomSession = async (roomSession: RoomSessionExpanded) => {
    if (!id) return;

    const roomLabel = roomSession.room ? roomSession.room.label : `ID ${roomSession.room_id}`;
    
    if (!window.confirm(`Are you sure you want to delete room session "${roomLabel}"?`)) {
      return;
    }

    try {
      await SessionsService.deleteRoomSessionForSession(parseInt(id), roomSession.id);
      toast.success('Room session deleted successfully');
      fetchSessionDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room session';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      
      if (editingRoomSession) {
        // Update existing room session
        await SessionsService.updateRoomSessionForSession(
          parseInt(id),
          editingRoomSession.id,
          formData
        );
        toast.success('Room session updated successfully');
      } else {
        // Create new room session
        await SessionsService.createRoomSessionForSession(
          parseInt(id),
          formData
        );
        toast.success('Room session created successfully');
      }
      
      setIsModalOpen(false);
      fetchSessionDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save room session';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const roomSessionColumns = [
    { key: 'id', label: 'ID' },
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
  if (error) return <ErrorDisplay message={error} onRetry={fetchSessionDetails} />;
  if (!session) return <ErrorDisplay message="Session not found" onRetry={() => navigate('/sessions')} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/sessions')} className="btn btn-secondary" style={{ marginBottom: '0.5rem' }}>
            ← Back to Sessions
          </button>
          <h1>{session.label}</h1>
        </div>
        <button onClick={handleCreateRoomSession} className="btn btn-primary">
          Create Room Session
        </button>
      </div>

      {/* Session Details Section */}
      <div className="session-details-section">
        <h2>Session Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Start Time:</span>
            <span className="info-value">{new Date(session.start_time).toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Slot Duration:</span>
            <span className="info-value">{session.slot_duration} minutes</span>
          </div>
          <div className="info-item">
            <span className="info-label">Time Between Slots:</span>
            <span className="info-value">{session.time_between_slots} minutes</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">{new Date(session.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Teams and Juries Section */}
      <div className="session-details-section">
        <h2>Associated Teams & Juries</h2>
        <div className="associations-grid">
          <div className="association-group">
            <h3>Teams</h3>
            <div className="chips-container">
              {session.teams && session.teams.length > 0 ? (
                session.teams.map((team) => (
                  <span key={team.id} className="chip chip-team">
                    {team.label}
                  </span>
                ))
              ) : (
                <span className="no-data-text">No teams assigned</span>
              )}
            </div>
          </div>
          <div className="association-group">
            <h3>Juries</h3>
            <div className="chips-container">
              {session.juries && session.juries.length > 0 ? (
                session.juries.map((jury) => (
                  <span key={jury.id} className="chip chip-jury">
                    {jury.label}
                  </span>
                ))
              ) : (
                <span className="no-data-text">No juries assigned</span>
              )}
            </div>
          </div>
          <div className="association-group">
            <h3>Rooms</h3>
            <div className="chips-container">
              {session.rooms && session.rooms.length > 0 ? (
                session.rooms.map((room) => (
                  <span key={room.id} className="chip" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #a5b4fc' }}>
                    {room.label}
                  </span>
                ))
              ) : (
                <span className="no-data-text">No rooms assigned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Room Sessions Section */}
      <div className="session-details-section">
        <h2>Room Sessions ({session.room_sessions?.length || 0})</h2>
        {session.room_sessions && session.room_sessions.length > 0 ? (
          <DataTable
            columns={roomSessionColumns}
            data={session.room_sessions}
            onEdit={handleEditRoomSession}
            onDelete={handleDeleteRoomSession}
          />
        ) : (
          <div className="empty-state">
            <p>No room sessions yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit Room Session */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoomSession ? "Edit Room Session" : "Create Room Session"}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="warning-message">
            <strong>⚠️ Note:</strong> Room sessions can only use teams and juries that are already associated with this session.
            {(session.teams && session.teams.length === 0) || (session.juries && session.juries.length === 0) ? (
              <span> Please use the Scheduling Wizard to add teams and juries to this session first.</span>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="room_id">Room</label>
            <select
              id="room_id"
              value={formData.room_id || ''}
              onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
              required
              className="form-input"
              disabled={saving}
            >
              <option value="" disabled>Select a room</option>
              {session.rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label>Select Teams</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allTeamIds = session.teams?.map((team) => team.id) || [];
                    setFormData({ ...formData, team_ids: allTeamIds });
                  }}
                  disabled={saving}
                >
                  Select All
                </button>
                <span className="control-separator">|</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setFormData({ ...formData, team_ids: [] });
                  }}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {session.teams && session.teams.length > 0 ? (
                session.teams.map((team) => (
                  <label key={team.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.team_ids.includes(team.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...formData.team_ids, team.id]
                          : formData.team_ids.filter((id) => id !== team.id);
                        setFormData({ ...formData, team_ids: newIds });
                      }}
                      disabled={saving}
                    />
                    {team.label}
                  </label>
                ))
              ) : (
                <p className="no-data-text">No teams available for this session</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label>Select Juries</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allJuryIds = session.juries?.map((jury) => jury.id) || [];
                    setFormData({ ...formData, jury_ids: allJuryIds });
                  }}
                  disabled={saving}
                >
                  Select All
                </button>
                <span className="control-separator">|</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setFormData({ ...formData, jury_ids: [] });
                  }}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {session.juries && session.juries.length > 0 ? (
                session.juries.map((jury) => (
                  <label key={jury.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.jury_ids.includes(jury.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...formData.jury_ids, jury.id]
                          : formData.jury_ids.filter((id) => id !== jury.id);
                        setFormData({ ...formData, jury_ids: newIds });
                      }}
                      disabled={saving}
                    />
                    {jury.label}
                  </label>
                ))
              ) : (
                <p className="no-data-text">No juries available for this session</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingRoomSession ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionDetail;
