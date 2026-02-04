/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsSummary } from '../models/AnalyticsSummary';
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
    /**
     * Get analytics summary
     * Returns analytics summary with competition fairness metrics including:
     * - Team-vs-team matrix: count how many times each pair of teams met in the same room session
     * - Team waiting times: total and average waiting time between session start and first room session, with per-session breakdown
     * - Team room distributions: count of room sessions per room for each team
     *
     * Supports optional filtering by session_id or date range.
     *
     * @param sessionId Filter results by a specific session ID
     * @param startDate Filter results by start date (ISO 8601 timestamp)
     * @param endDate Filter results by end date (ISO 8601 timestamp)
     * @returns AnalyticsSummary Analytics summary retrieved successfully
     * @throws ApiError
     */
    public static getAnalyticsSummary(
        sessionId?: number,
        startDate?: string,
        endDate?: string,
    ): CancelablePromise<AnalyticsSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/summary',
            query: {
                'session_id': sessionId,
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                400: `Invalid request parameters`,
                500: `Internal server error`,
            },
        });
    }
}
