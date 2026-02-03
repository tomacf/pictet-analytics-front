/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SchedulingService {
    /**
     * Trigger scheduling
     * Triggers the scheduling algorithm (placeholder implementation)
     * @returns any Scheduling executed successfully
     * @throws ApiError
     */
    public static scheduleSessions(): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scheduling/schedule',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Trigger optimization
     * Triggers the schedule optimization algorithm (placeholder implementation)
     * @returns any Optimization executed successfully
     * @throws ApiError
     */
    public static optimizeSchedule(): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scheduling/optimize',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
