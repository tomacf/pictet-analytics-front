/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DraftEntity } from './DraftEntity';
import type { DraftSlot } from './DraftSlot';
export type DraftPlan = {
    /**
     * Suggested label for the session extracted from PDF
     */
    session_label: string;
    /**
     * Start date/time extracted from PDF
     */
    session_date: string;
    /**
     * Teams extracted from PDF (by label only, IDs to be resolved)
     */
    teams: Array<DraftEntity>;
    /**
     * Juries extracted from PDF (by label only, IDs to be resolved)
     */
    juries: Array<DraftEntity>;
    /**
     * Rooms extracted from PDF (by label only, IDs to be resolved)
     */
    rooms: Array<DraftEntity>;
    /**
     * Number of teams per room extracted from PDF
     */
    teams_per_room: number;
    /**
     * Number of juries per room extracted from PDF
     */
    juries_per_room: number;
    /**
     * Slot duration in minutes extracted from PDF
     */
    slot_duration: number;
    /**
     * Time between slots in minutes extracted from PDF
     */
    time_between_slots: number;
    /**
     * Scheduling slots extracted from PDF
     */
    slots: Array<DraftSlot>;
};

