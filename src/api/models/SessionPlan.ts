/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoomJuryAssignment } from './RoomJuryAssignment';
import type { SessionPlanSlot } from './SessionPlanSlot';
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
     * Room-jury assignments for the session. Each room can have multiple juries assigned.
     */
    room_jury_assignments?: Array<RoomJuryAssignment>;
    /**
     * Array of time slots with room, team, and jury assignments
     */
    slots: Array<SessionPlanSlot>;
};

