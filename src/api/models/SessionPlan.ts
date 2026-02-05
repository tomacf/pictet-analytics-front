/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionPlanSlot } from './SessionPlanSlot';

/**
 * Mapping of room ID to jury IDs for room-level jury assignment
 * Supports multiple juries per room based on juries_per_room configuration
 */
export type RoomJuryAssignment = {
    room_id: number;
    jury_ids: Array<number>;
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
     * Room-level jury assignments. Each entry maps a room to its assigned juries.
     * Supports multiple juries per room based on juries_per_room configuration.
     * When provided, this takes precedence over slot-level jury_ids.
     */
    room_jury_assignments?: Array<RoomJuryAssignment>;
    /**
     * Array of time slots with room, team, and jury assignments
     */
    slots: Array<SessionPlanSlot>;
};

