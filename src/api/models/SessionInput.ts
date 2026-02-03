/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionInput = {
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
     * Optional array of team IDs to associate with the session
     */
    team_ids?: Array<number>;
    /**
     * Optional array of jury IDs to associate with the session
     */
    jury_ids?: Array<number>;
    /**
     * Optional array of room IDs to associate with the session
     */
    room_ids?: Array<number>;
};

