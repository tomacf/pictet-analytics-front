/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionUpdateRequest = {
    /**
     * Session label
     */
    label: string;
    /**
     * Session start time
     */
    start_time: string;
    /**
     * Duration of each slot in minutes
     */
    slot_duration: number;
    /**
     * Gap between slots in minutes
     */
    time_between_slots: number;
    /**
     * Optional array of team IDs to link to this session. If provided, the session's teams will be replaced with this list.
     */
    team_ids?: Array<number>;
    /**
     * Optional array of jury IDs to link to this session. If provided, the session's juries will be replaced with this list.
     */
    jury_ids?: Array<number>;
    /**
     * Optional array of room IDs to link to this session. If provided, the session's rooms will be replaced with this list.
     */
    room_ids?: Array<number>;
    /**
     * If true, allows removing teams/juries/rooms that are used in room sessions by also deleting the affected room_session relationships. If false or omitted, returns 409 Conflict when trying to remove used entities.
     */
    force?: boolean;
};

