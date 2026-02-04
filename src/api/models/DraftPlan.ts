/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DraftPlanSlot } from './DraftPlanSlot';
export type DraftPlan = {
    /**
     * Optional label for the session
     */
    session_label?: string;
    /**
     * Schedule date
     */
    date: string;
    /**
     * Duration of each slot in minutes
     */
    slot_duration: number;
    /**
     * Gap between slots in minutes
     */
    time_between_slots: number;
    /**
     * Array of jury IDs available for assignment
     */
    jury_ids: Array<number>;
    /**
     * Number of juries to assign per room
     */
    juries_per_room: number;
    /**
     * Array of schedule slots with room, time, teams, and assigned juries
     */
    slots: Array<DraftPlanSlot>;
};

