/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Type of scheduling constraint violation:
 * * `team_duplicate` - A team can appear at most once within a given session
 * * `jury_time_overlap` - A jury cannot be assigned to overlapping time ranges
 *
 */
export const SCHEDULING_CONFLICT_TYPES = {
    TEAM_DUPLICATE: 'team_duplicate',
    JURY_TIME_OVERLAP: 'jury_time_overlap',
} as const;

export type SchedulingConflictType = typeof SCHEDULING_CONFLICT_TYPES[keyof typeof SCHEDULING_CONFLICT_TYPES];
