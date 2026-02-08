/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IDLabel } from './IDLabel';
import type { RoomAssignment } from './RoomAssignment';
export type SessionExpanded = {
    /**
     * Session ID
     */
    id: number;
    /**
     * Session label
     */
    label: string;
    /**
     * Session start time
     */
    start_time: string;
    /**
     * Timezone of the session start time
     */
    start_time_tz?: string;
    /**
     * Duration of each slot in minutes
     */
    slot_duration: number;
    /**
     * Gap between slots in minutes
     */
    time_between_slots: number;
    /**
     * Timestamp when the session was created
     */
    created_at: string;
    /**
     * Timezone of the created_at timestamp
     */
    created_at_tz?: string;
    /**
     * Timestamp when the session was last updated
     */
    updated_at: string;
    /**
     * Timezone of the updated_at timestamp
     */
    updated_at_tz?: string;
    /**
     * Associated teams (present when expand=teams is used)
     */
    teams?: Array<IDLabel>;
    /**
     * Associated juries (present when expand=juries is used)
     */
    juries?: Array<IDLabel>;
    /**
     * Associated rooms (present when expand=rooms is used)
     */
    rooms?: Array<IDLabel>;
    /**
     * Total count of room sessions associated with this session (present when expand=summary is used)
     */
    room_sessions_count?: number;
    /**
     * Start time of the first room session (present when expand=summary is used)
     */
    first_room_session_start_time?: string;
    /**
     * Timezone of the first room session start time (present when expand=summary is used)
     */
    first_room_session_start_time_tz?: string;
    /**
     * End time of the last room session (present when expand=summary is used)
     */
    last_room_session_end_time?: string;
    /**
     * Timezone of the last room session end time (present when expand=summary is used)
     */
    last_room_session_end_time_tz?: string;
    /**
     * Room assignments with juries per room (present when expand=room_assignments is used). Each entry represents a room in this session with its assigned juries.
     */
    room_assignments?: Array<RoomAssignment>;
};

