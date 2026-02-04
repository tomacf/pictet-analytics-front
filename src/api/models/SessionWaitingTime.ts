/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionWaitingTime = {
    /**
     * Session ID
     */
    session_id: number;
    /**
     * Session label
     */
    session_label: string;
    /**
     * When the session started
     */
    session_start_time: string;
    /**
     * When the team's first room session started
     */
    first_room_start_time: string;
    /**
     * Waiting time in minutes
     */
    waiting_time_minutes: number;
};

