/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * Get analytics report
     * Generates an analytics report (placeholder implementation)
     * @returns any Analytics report generated successfully
     * @throws ApiError
     */
    public static getAnalyticsReport(): CancelablePromise<{
        report?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/report',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get metrics
     * Retrieves system metrics (placeholder implementation)
     * @returns any Metrics retrieved successfully
     * @throws ApiError
     */
    public static getMetrics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/metrics',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
