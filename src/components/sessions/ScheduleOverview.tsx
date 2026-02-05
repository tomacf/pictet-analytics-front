import React from 'react';
import type {RoomSessionExpanded} from '../../apiConfig';
import './ScheduleOverview.css';

interface RoomJuryInfo {
  roomId: number;
  juryLabels: string[];
}

interface ScheduleOverviewProps {
  roomSessions: RoomSessionExpanded[];
  rooms?: Array<{ id: number; label: string }>;
  // Optional room-level jury info for display in header (supports multiple juries per room)
  roomJuryInfo?: RoomJuryInfo[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  sessions: Map<number, RoomSessionExpanded>; // roomId -> session
}

const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({ roomSessions, rooms, roomJuryInfo = [] }) => {
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

  // Helper to get room jury labels (supports multiple juries per room)
  const getRoomJuryLabels = (roomId: number): string[] => {
    const info = roomJuryInfo.find(r => r.roomId === roomId);
    if (info) return info.juryLabels;
    
    // Fallback: try to get from first session in this room
    const roomSession = roomSessions.find(s => s.room_id === roomId);
    if (roomSession?.juries && roomSession.juries.length > 0) {
      return roomSession.juries.map(j => j.label);
    }
    return [];
  };

  return (
    <div className="schedule-overview-matrix">
      <div className="schedule-overview-table-wrapper">
        <table className="schedule-overview-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {sortedRooms.map(([roomId, roomLabel]) => {
                const juryLabels = getRoomJuryLabels(roomId);
                return (
                  <th key={roomId} className="room-header">
                    <div className="room-header-content">
                      <span className="room-name">{roomLabel}</span>
                      {juryLabels.length > 0 ? (
                        <span className="room-jury-label">{juryLabels.join(', ')}</span>
                      ) : (
                        <span className="room-jury-missing">No jury assigned</span>
                      )}
                    </div>
                  </th>
                );
              })}
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
                  return (
                    <td key={roomId} className="session-cell">
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
                          {(!session.teams || session.teams.length === 0) && (
                            <span className="empty-session">No teams</span>
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
