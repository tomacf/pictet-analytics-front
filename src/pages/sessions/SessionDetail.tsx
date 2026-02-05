import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  SessionsService, 
  TeamsService, 
  JuriesService, 
  RoomsService, 
  type SessionExpanded, 
  type RoomSessionExpanded,
  type Team,
  type Jury,
  type Room
} from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import ScheduleOverview from '../../components/sessions/ScheduleOverview';
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

interface SessionScopeFormData {
  team_ids: number[];
  jury_ids: number[];
  room_ids: number[];
}

// Extend SessionExpanded to include room_sessions
interface SessionExpandedWithRoomSessions extends SessionExpanded {
  room_sessions?: RoomSessionExpanded[];
}

// Helper function to convert ISO string to local datetime-local format
const isoToLocalDatetimeInput = (isoString: string): string => {
  if (!isoString) return '';
  // Create date from ISO string and format for datetime-local input
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

// Helper function to convert datetime-local input to ISO string
const localDatetimeInputToISO = (localDatetime: string): string => {
  if (!localDatetime) return '';
  // The datetime-local input value is in local time, so we need to convert to UTC
  return new Date(localDatetime).toISOString();
};

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionExpandedWithRoomSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state for room sessions section
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');
  
  // Room Session Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomSession, setEditingRoomSession] = useState<RoomSessionExpanded | null>(null);
  const [formData, setFormData] = useState<RoomSessionFormData>({
    room_id: 0,
    start_time: '',
    end_time: '',
    team_ids: [],
    jury_ids: [],
  });

  // Session Scope Modal State
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allJuries, setAllJuries] = useState<Jury[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [scopeFormData, setScopeFormData] = useState<SessionScopeFormData>({
    team_ids: [],
    jury_ids: [],
    room_ids: [],
  });

  const fetchSessionDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await SessionsService.getSessionById(
        parseInt(id),
        'teams,juries,rooms,room_sessions'
      );
      setSession(data as SessionExpandedWithRoomSessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session details';
      setError(message);
      toast.error('Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

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

  // Session Scope Handlers
  const handleEditSessionScope = async () => {
    try {
      // Load all available teams, juries, and rooms
      const [teamsData, juriesData, roomsData] = await Promise.all([
        TeamsService.getAllTeams(),
        JuriesService.getAllJuries(),
        RoomsService.getAllRooms(),
      ]);
      
      setAllTeams(teamsData);
      setAllJuries(juriesData);
      setAllRooms(roomsData);
      
      // Pre-fill with current session scope
      setScopeFormData({
        team_ids: session?.teams?.map(t => t.id) || [],
        jury_ids: session?.juries?.map(j => j.id) || [],
        room_ids: session?.rooms?.map(r => r.id) || [],
      });
      
      setIsScopeModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      toast.error(message);
    }
  };

  const handleSaveSessionScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !session) return;

    try {
      setSaving(true);
      
      // Update session with new scope
      await SessionsService.updateSession(parseInt(id), {
        label: session.label,
        start_time: session.start_time,
        slot_duration: session.slot_duration,
        time_between_slots: session.time_between_slots,
        team_ids: scopeFormData.team_ids,
        jury_ids: scopeFormData.jury_ids,
        room_ids: scopeFormData.room_ids,
      });
      
      toast.success('Session scope updated successfully');
      setIsScopeModalOpen(false);
      fetchSessionDetails();
    } catch (err: unknown) {
      // Handle 409 Conflict errors specially
      const isConflictError = (err as { status?: number })?.status === 409 || 
                              (err instanceof Error && err.message?.includes('409'));
      
      if (isConflictError) {
        const message = err instanceof Error ? err.message : 'Cannot remove items that are in use by room sessions';
        toast.error(message, { autoClose: 8000 });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update session scope';
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Download PDF Handler
  const handleDownloadPdf = () => {
    if (!id) return;

    setDownloading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const pdfUrl = `${apiUrl}/api/sessions/${id}/export.pdf`;
      
      // Open PDF in new tab (this will trigger download or display based on browser settings)
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        toast.error('Failed to open PDF. Please check your popup blocker settings.');
      }
    } finally {
      // Reset loading state after a brief delay to show user feedback
      setTimeout(() => setDownloading(false), 500);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleDownloadPdf} 
            className="btn btn-secondary"
            disabled={downloading}
          >
            {downloading ? '📄 Downloading...' : '📄 Download PDF'}
          </button>
          <button onClick={handleCreateRoomSession} className="btn btn-primary">
            Create Room Session
          </button>
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Associated Teams & Juries</h2>
          <button onClick={handleEditSessionScope} className="btn btn-secondary">
            Edit Session Scope
          </button>
        </div>
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

      {/* Room Sessions Section with Tabs */}
      <div className="session-details-section">
        <h2>Room Sessions ({session.room_sessions?.length || 0})</h2>
        
        {/* Tab Navigation */}
        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📅 Schedule Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 Room Sessions List
            </button>
          </div>
          
          <div className="tabs-content">
            {activeTab === 'overview' ? (
              <div className="tab-panel">
                {session.room_sessions && session.room_sessions.length > 0 ? (
                  <ScheduleOverview 
                    roomSessions={session.room_sessions}
                    rooms={session.rooms}
                  />
                ) : (
                  <div className="empty-state">
                    <p>No room sessions scheduled yet. Create one to get started.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="tab-panel">
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
            )}
          </div>
        </div>
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
              <span> Please use the "Edit Session Scope" button to add teams and juries to this session first.</span>
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
              value={isoToLocalDatetimeInput(formData.start_time)}
              onChange={(e) => setFormData({ ...formData, start_time: localDatetimeInputToISO(e.target.value) })}
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
              value={isoToLocalDatetimeInput(formData.end_time)}
              onChange={(e) => setFormData({ ...formData, end_time: localDatetimeInputToISO(e.target.value) })}
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

      {/* Modal for Edit Session Scope */}
      <Modal
        isOpen={isScopeModalOpen}
        onClose={() => setIsScopeModalOpen(false)}
        title="Edit Session Scope"
      >
        <form onSubmit={handleSaveSessionScope} className="form">
          <div className="warning-message">
            <strong>⚠️ Warning:</strong> Removing teams, juries, or rooms that are currently used by existing room sessions may fail. 
            If you encounter an error, you'll need to update or remove those room sessions first before removing items from the session scope.
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label>Select Teams</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allTeamIds = allTeams.map((team) => team.id);
                    setScopeFormData({ ...scopeFormData, team_ids: allTeamIds });
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
                    setScopeFormData({ ...scopeFormData, team_ids: [] });
                  }}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {allTeams.length > 0 ? (
                allTeams.map((team) => (
                  <label key={team.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={scopeFormData.team_ids.includes(team.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...scopeFormData.team_ids, team.id]
                          : scopeFormData.team_ids.filter((id) => id !== team.id);
                        setScopeFormData({ ...scopeFormData, team_ids: newIds });
                      }}
                      disabled={saving}
                    />
                    {team.label}
                  </label>
                ))
              ) : (
                <p className="no-data-text">No teams available</p>
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
                    const allJuryIds = allJuries.map((jury) => jury.id);
                    setScopeFormData({ ...scopeFormData, jury_ids: allJuryIds });
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
                    setScopeFormData({ ...scopeFormData, jury_ids: [] });
                  }}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {allJuries.length > 0 ? (
                allJuries.map((jury) => (
                  <label key={jury.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={scopeFormData.jury_ids.includes(jury.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...scopeFormData.jury_ids, jury.id]
                          : scopeFormData.jury_ids.filter((id) => id !== jury.id);
                        setScopeFormData({ ...scopeFormData, jury_ids: newIds });
                      }}
                      disabled={saving}
                    />
                    {jury.label}
                  </label>
                ))
              ) : (
                <p className="no-data-text">No juries available</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label>Select Rooms</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allRoomIds = allRooms.map((room) => room.id);
                    setScopeFormData({ ...scopeFormData, room_ids: allRoomIds });
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
                    setScopeFormData({ ...scopeFormData, room_ids: [] });
                  }}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {allRooms.length > 0 ? (
                allRooms.map((room) => (
                  <label key={room.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={scopeFormData.room_ids.includes(room.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...scopeFormData.room_ids, room.id]
                          : scopeFormData.room_ids.filter((id) => id !== room.id);
                        setScopeFormData({ ...scopeFormData, room_ids: newIds });
                      }}
                      disabled={saving}
                    />
                    {room.label}
                  </label>
                ))
              ) : (
                <p className="no-data-text">No rooms available</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setIsScopeModalOpen(false)} 
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
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionDetail;
