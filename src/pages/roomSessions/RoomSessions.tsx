import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { RoomSessionsService, type RoomSessionExpanded, type RoomSessionInput, type RoomSessionUpdateInput, RoomsService, SessionsService, TeamsService, JuriesService, type Room, type Session, type Team, type Jury } from '../../apiConfig';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorDisplay from '../../components/shared/ErrorDisplay';
import {
  detectTeamConflicts,
  detectJuryConflicts,
  isTeamConflicted,
  isJuryConflicted,
  type SlotAssignment,
} from '../../utils/validationUtils';
import { is409Error, format409Error } from '../../utils/errorUtils';
import '../teams/Teams.css';
import './RoomSessions.css';

const RoomSessions = () => {
  const [roomSessions, setRoomSessions] = useState<RoomSessionExpanded[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [juries, setJuries] = useState<Jury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomSessionInput>({
    room_id: 0,
    session_id: 0,
    start_time: '',
    end_time: '',
    team_ids: [],
    jury_ids: [],
  });

  // Filter states
  const [filterSession, setFilterSession] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Conflict detection - compute conflicts based on current draft state
  const conflicts = useMemo(() => {
    // Get all room sessions for the same session as the form
    const sessionRoomSessions = roomSessions.filter(
      (rs) => rs.session_id === formData.session_id && rs.id !== editingId
    );

    // Create a combined list: existing sessions + current draft
    const allSlots: SlotAssignment[] = [
      ...sessionRoomSessions.map((rs) => ({
        startTime: rs.start_time,
        endTime: rs.end_time,
        teamIds: rs.teams?.map((t) => t.id) || [],
        juryIds: rs.juries?.map((j) => j.id) || [],
      })),
    ];

    // Add the current draft if it has data
    if (formData.session_id && formData.start_time && formData.end_time) {
      allSlots.push({
        startTime: formData.start_time,
        endTime: formData.end_time,
        teamIds: formData.team_ids || [],
        juryIds: formData.jury_ids || [],
      });
    }

    const teamConflicts = detectTeamConflicts(allSlots);
    const juryConflicts = detectJuryConflicts(allSlots);

    return { teamConflicts, juryConflicts };
  }, [roomSessions, formData, editingId]);

  const hasConflicts = conflicts.teamConflicts.length > 0 || conflicts.juryConflicts.length > 0;

  // Helper to get checkbox styling for conflict highlighting
  const getCheckboxClassName = (isSelected: boolean, hasConflict: boolean): string => {
    return `checkbox-label ${hasConflict && isSelected ? 'checkbox-label-conflict' : ''}`;
  };

  // Helper to get checkbox title for conflict tooltip
  const getCheckboxTitle = (entityType: 'team' | 'jury', isSelected: boolean, hasConflict: boolean): string => {
    if (!hasConflict || !isSelected) return '';
    return entityType === 'team' 
      ? 'This team is already assigned to another slot in this session'
      : 'This jury has overlapping time slot assignments';
  };

  const fetchRoomSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomSessionsData, roomsData, sessionsData, teamsData, juriesData] = await Promise.all([
        RoomSessionsService.getAllRoomSessions({ expand: 'session,room,teams,juries' }),
        RoomsService.getAllRooms(),
        SessionsService.getAllSessions({}),
        TeamsService.getAllTeams(),
        JuriesService.getAllJuries(),
      ]);
      setRoomSessions(roomSessionsData as RoomSessionExpanded[]);
      setRooms(roomsData);
      setSessions(sessionsData);
      setTeams(teamsData);
      setJuries(juriesData);
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
    setEditingId(null);
    const now = new Date().toISOString().slice(0, 16);
    setFormData({
      room_id: 0,
      session_id: 0,
      start_time: now, // Default to current datetime
      end_time: now, // Default to current datetime
      team_ids: [],
      jury_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (roomSession: RoomSessionExpanded) => {
    setEditingId(roomSession.id);
    setFormData({
      room_id: roomSession.room_id,
      session_id: roomSession.session_id,
      start_time: roomSession.start_time,
      end_time: roomSession.end_time,
      team_ids: roomSession.teams?.map(t => t.id) || [],
      jury_ids: roomSession.juries?.map(j => j.id) || [],
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
      await RoomSessionsService.deleteRoomSession({ id: roomSession.id });
      toast.success('Room session deleted successfully');
      fetchRoomSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room session';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasConflicts) {
      toast.error('Cannot save room session with conflicts. Please resolve all conflicts first.');
      return;
    }

    try {
      if (editingId) {
        // Update existing room session
        const updateData: RoomSessionUpdateInput = {
          room_id: formData.room_id,
          session_id: formData.session_id,
          start_time: formData.start_time,
          end_time: formData.end_time,
          team_ids: formData.team_ids,
          jury_ids: formData.jury_ids,
        };
        await RoomSessionsService.updateRoomSession({ id: editingId, requestBody: updateData });
        toast.success('Room session updated successfully');
      } else {
        // Create new room session
        await RoomSessionsService.createRoomSession({ requestBody: formData });
        toast.success('Room session created successfully');
      }
      setIsModalOpen(false);
      fetchRoomSessions();
    } catch (err: unknown) {
      // Handle 409 Conflict errors specially
      if (is409Error(err)) {
        const errorMessage = format409Error(err, 'The room session contains conflicts.');
        toast.error(errorMessage, { autoClose: 8000 });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save room session';
        toast.error(message);
      }
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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Room Session" : "Create Room Session"}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="warning-message">
            <strong>⚠️ Note:</strong> Adding teams/juries/room here will also update the parent Session's selected teams/juries/rooms for consistency.
          </div>

          {/* Conflicts Panel */}
          {hasConflicts && (
            <div className="conflicts-panel">
              <h3>🚫 Conflicts Detected</h3>
              <p>The following conflicts must be resolved before saving:</p>
              <div className="conflicts-content">
                {conflicts.teamConflicts.length > 0 && (
                  <div className="conflicts-section">
                    <strong>Team Conflicts (each team can only be assigned once per session):</strong>
                    <ul className="conflicts-list">
                      {conflicts.teamConflicts.map((conflict) => {
                        const team = teams.find((t) => t.id === conflict.teamId);
                        return (
                          <li key={conflict.teamId}>
                            <strong>{team?.label || `Team ${conflict.teamId}`}</strong> is assigned to multiple slots in this session
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {conflicts.juryConflicts.length > 0 && (
                  <div className="conflicts-section">
                    <strong>Jury Conflicts (juries cannot be in overlapping time slots):</strong>
                    <ul className="conflicts-list">
                      {conflicts.juryConflicts.map((conflict) => {
                        const jury = juries.find((j) => j.id === conflict.juryId);
                        return (
                          <li key={conflict.juryId}>
                            <strong>{jury?.label || `Jury ${conflict.juryId}`}</strong> has overlapping time slot assignments
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

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

          <div className="form-group">
            <div className="form-group-header">
              <label>Select Teams</label>
              <div className="select-controls">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    const allTeamIds = teams.map((team) => team.id);
                    setFormData({ ...formData, team_ids: allTeamIds });
                  }}
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
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {teams.length > 0 ? (
                teams.map((team) => {
                  const hasConflict = isTeamConflicted(team.id, conflicts.teamConflicts);
                  const isSelected = formData.team_ids?.includes(team.id) ?? false;
                  return (
                    <label 
                      key={team.id} 
                      className={getCheckboxClassName(isSelected, hasConflict)}
                      title={getCheckboxTitle('team', isSelected, hasConflict)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentTeamIds = formData.team_ids ?? [];
                          const newIds = e.target.checked
                            ? [...currentTeamIds, team.id]
                            : currentTeamIds.filter((id) => id !== team.id);
                          setFormData({ ...formData, team_ids: newIds });
                        }}
                      />
                      {team.label}
                    </label>
                  );
                })
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
                    const allJuryIds = juries.map((jury) => jury.id);
                    setFormData({ ...formData, jury_ids: allJuryIds });
                  }}
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
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="checkbox-group">
              {juries.length > 0 ? (
                juries.map((jury) => {
                  const hasConflict = isJuryConflicted(jury.id, conflicts.juryConflicts);
                  const isSelected = formData.jury_ids?.includes(jury.id) ?? false;
                  return (
                    <label 
                      key={jury.id} 
                      className={getCheckboxClassName(isSelected, hasConflict)}
                      title={getCheckboxTitle('jury', isSelected, hasConflict)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentJuryIds = formData.jury_ids ?? [];
                          const newIds = e.target.checked
                            ? [...currentJuryIds, jury.id]
                            : currentJuryIds.filter((id) => id !== jury.id);
                          setFormData({ ...formData, jury_ids: newIds });
                        }}
                      />
                      {jury.label}
                    </label>
                  );
                })
              ) : (
                <p className="no-data-text">No juries available</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={hasConflicts}
              title={hasConflicts ? 'Please resolve all conflicts before saving' : ''}
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomSessions;
