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
     * ID of the team in the session
     */
    team_id: number;
    /**
     * ID of the jury in the session
     */
    jury_id: number;
    /**
     * Session start time
     */
    start_time: string;
    /**
     * Session end time
     */
    end_time: string;
    /**
     * Timestamp when the session was created
     */
    created_at: string;
    /**
     * Timestamp when the session was last updated
     */
    updated_at: string;
};

