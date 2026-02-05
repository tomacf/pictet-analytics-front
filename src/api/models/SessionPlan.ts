/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionPlanSlot } from './SessionPlanSlot';

/**
 * Mapping of room ID to jury ID for room-level jury assignment
 */
export type RoomJuryAssignment = {
    room_id: number;
    jury_id: number | null;
};

export type SessionPlan = {
    /**
     * IDs of rooms associated with the session
     */
    room_ids: Array<number>;
    /**
     * IDs of teams associated with the session
     */
    team_ids: Array<number>;
    /**
     * IDs of juries associated with the session
     */
    jury_ids: Array<number>;
    /**
     * Number of teams per room
     */
    teams_per_room: number;
    /**
     * Number of juries per room
     */
    juries_per_room: number;
    /**
     * Room-level jury assignments. Each entry maps a room to its assigned jury.
     * When provided, this takes precedence over slot-level jury_ids.
     */
    room_jury_assignments?: Array<RoomJuryAssignment>;
    /**
     * Array of time slots with room, team, and jury assignments
     */
    slots: Array<SessionPlanSlot>;
};

