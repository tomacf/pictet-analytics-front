/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DraftPlanSlot = {
    /**
     * Room ID (resolved from database)
     */
    room_id: number;
    /**
     * Room label/name (parsed from PDF)
     */
    room_label: string;
    /**
     * Slot start time
     */
    start_time: string;
    /**
     * Slot end time
     */
    end_time: string;
    /**
     * Array of team IDs (resolved from database)
     */
    team_ids: Array<number>;
    /**
     * Array of team labels/codes (parsed from PDF)
     */
    team_labels: Array<string>;
    /**
     * Array of jury IDs assigned to this slot (auto-assigned round-robin)
     */
    jury_ids: Array<number>;
};

