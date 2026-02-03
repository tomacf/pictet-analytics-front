/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RoomSessionUpdateInput = {
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
     * Room session end time
     */
    end_time: string;
    /**
     * Array of team IDs to associate with this room session (replaces existing)
     */
    team_ids?: Array<number>;
    /**
     * Array of jury IDs to associate with this room session (replaces existing)
     */
    jury_ids?: Array<number>;
};

