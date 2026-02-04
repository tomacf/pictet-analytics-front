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
export type SchedulingConflictType = 'team_duplicate' | 'jury_time_overlap';
