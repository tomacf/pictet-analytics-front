/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SchedulingConflictType } from './SchedulingConflictType';
import type { TimeRange } from './TimeRange';
export type SchedulingConflict = {
    type: SchedulingConflictType;
    /**
     * ID of the entity (team or jury) that violates the constraint
     */
    entity_id: number;
    /**
     * IDs of room sessions that conflict with the proposed change
     */
    conflicting_room_session_ids: Array<number>;
    /**
     * Time ranges of the conflicting room sessions (only for time overlap conflicts)
     */
    time_ranges?: Array<TimeRange>;
};

