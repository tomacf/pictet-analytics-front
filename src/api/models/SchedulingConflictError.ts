/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SchedulingConflict } from './SchedulingConflict';
export type SchedulingConflictError = {
    /**
     * Human-readable error message
     */
    message: string;
    /**
     * List of scheduling conflicts detected
     */
    conflicts: Array<SchedulingConflict>;
};

