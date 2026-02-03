/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Session = {
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
     * Timestamp when the session was last updated
     */
    updated_at: string;
};

