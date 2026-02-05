import React from 'react';
import type {RoomSessionExpanded} from '../../apiConfig';
import './ScheduleOverview.css';

interface ScheduleOverviewProps {
  roomSessions: RoomSessionExpanded[];
  rooms?: Array<{ id: number; label: string }>;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  sessions: Map<number, RoomSessionExpanded>; // roomId -> session
}

const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({ roomSessions, rooms }) => {
  if (!roomSessions || roomSessions.length === 0) {
    return (
      <div className="schedule-overview-empty">
        <p>No room sessions scheduled yet.</p>
      </div>
    );
  }

  // Get unique rooms from sessions
  const roomsMap = new Map<number, string>();
  roomSessions.forEach(session => {
    if (session.room) {
      roomsMap.set(session.room.id, session.room.label);
    } else if (rooms) {
      const room = rooms.find(r => r.id === session.room_id);
      if (room) {
        roomsMap.set(room.id, room.label);
      }
    }
    if (!roomsMap.has(session.room_id)) {
      roomsMap.set(session.room_id, `Room ${session.room_id}`);
    }
  });

  const sortedRooms = Array.from(roomsMap.entries()).sort((a, b) => a[0] - b[0]);

  // Group sessions by time slots
  const timeSlotsMap = new Map<string, TimeSlot>();

  roomSessions.forEach(session => {
    const key = `${session.start_time}_${session.end_time}`;

    if (!timeSlotsMap.has(key)) {
      timeSlotsMap.set(key, {
        startTime: session.start_time,
        endTime: session.end_time,
        sessions: new Map()
      });
    }

    const slot = timeSlotsMap.get(key)!;
    slot.sessions.set(session.room_id, session);
  });

  // Sort time slots by start time
  const sortedTimeSlots = Array.from(timeSlotsMap.values()).sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="schedule-overview-matrix">
      <div className="schedule-overview-table-wrapper">
        <table className="schedule-overview-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {sortedRooms.map(([roomId, roomLabel]) => (
                <th key={roomId} className="room-header">
                  {roomLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTimeSlots.map((slot, idx) => (
              <tr key={idx}>
                <td className="time-cell">
                  <div className="time-range">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                </td>
                {sortedRooms.map(([roomId]) => {
                  const session = slot.sessions.get(roomId);
                  const hasMissingJuries = session && (!session.juries || session.juries.length === 0);
                  return (
                    <td key={roomId} className={`session-cell ${hasMissingJuries ? 'cell-missing-juries' : ''}`}>
                      {session ? (
                        <div className="session-content">
                          {session.teams && session.teams.length > 0 && (
                            <div className="cell-group">
                              <div className="cell-chips">
                                {session.teams.map(team => (
                                  <span key={team.id} className="cell-chip chip-team">
                                    {team.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.juries && session.juries.length > 0 && (
                            <div className="cell-group">
                              <div className="cell-chips">
                                {session.juries.map(jury => (
                                  <span key={jury.id} className="cell-chip chip-jury">
                                    {jury.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(!session.teams || session.teams.length === 0) &&
                           (!session.juries || session.juries.length === 0) && (
                            <span className="empty-session">No assignments</span>
                          )}
                          {hasMissingJuries && session.teams && session.teams.length > 0 && (
                            <div className="missing-juries-badge">
                              <span className="warning-icon">⚠</span>
                              <span className="warning-text">No juries</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="empty-cell">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleOverview;
