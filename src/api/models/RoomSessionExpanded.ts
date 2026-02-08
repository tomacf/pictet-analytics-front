/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IDLabel } from './IDLabel';
export type RoomSessionExpanded = {
    /**
     * Room session ID
     */
    id: number;
    /**
     * ID of the room
     */
    room_id: number;
    /**
     * ID of the session
     */
    session_id: number;
    /**
     * Room session start time
     */
    start_time: string;
    /**
     * Timezone of the room session start time
     */
    start_time_tz?: string;
    /**
     * Room session end time
     */
    end_time: string;
    /**
     * Timezone of the room session end time
     */
    end_time_tz?: string;
    /**
     * Timestamp when the room session was created
     */
    created_at: string;
    /**
     * Timezone of the created_at timestamp
     */
    created_at_tz?: string;
    /**
     * Timestamp when the room session was last updated
     */
    updated_at: string;
    /**
     * Timezone of the updated_at timestamp
     */
    updated_at_tz?: string;
    room?: IDLabel;
    session?: IDLabel;
    /**
     * Teams associated with this room session
     */
    teams?: Array<IDLabel>;
    /**
     * Juries associated with this room session
     */
    juries?: Array<IDLabel>;
};

