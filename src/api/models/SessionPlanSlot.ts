/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionPlanSlot = {
    /**
     * ID of the room for this slot
     */
    room_id: number;
    /**
     * Slot start time
     */
    start_time: string;
    /**
     * Slot end time
     */
    end_time: string;
    /**
     * IDs of teams assigned to this slot (must be subset of session team_ids)
     */
    team_ids: Array<number>;
    /**
     * IDs of juries assigned to this slot (must be subset of session jury_ids)
     */
    jury_ids: Array<number>;
};

