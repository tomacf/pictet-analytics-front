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
};

