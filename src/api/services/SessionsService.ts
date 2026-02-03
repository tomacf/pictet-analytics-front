/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Session } from '../models/Session';
import type { SessionInput } from '../models/SessionInput';
import type { SessionPlan } from '../models/SessionPlan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
    /**
     * Create a new session
     * Creates a new session with label and scheduling parameters
     * @param requestBody
     * @returns Session Session created successfully
     * @throws ApiError
     */
    public static createSession(
        requestBody: SessionInput,
    ): CancelablePromise<Session> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all sessions
     * Retrieves a list of all sessions
     * @returns Session List of sessions
     * @throws ApiError
     */
    public static getAllSessions(): CancelablePromise<Array<Session>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update an existing session
     * Updates a session with the provided information. The ID is provided in the URL path, not in the request body.
     * @param id Session ID
     * @param requestBody
     * @returns Session Session updated successfully
     * @throws ApiError
     */
    public static updateSession(
        id: number,
        requestBody: SessionInput,
    ): CancelablePromise<Session> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sessions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a session by ID
     * Retrieves a specific session by its ID
     * @param id Session ID
     * @returns Session Session found
     * @throws ApiError
     */
    public static getSessionById(
        id: number,
    ): CancelablePromise<Session> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Delete a session
     * Deletes a specific session by its ID
     * @param id Session ID
     * @returns void
     * @throws ApiError
     */
    public static deleteSession(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/sessions/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Save a full session plan
     * Saves a complete session plan including session-level links (rooms, teams, juries) and slots.
     * Validates that all IDs exist and that slot team/jury IDs are subsets of the session selections.
     * Persists transactionally: upserts session_rooms/session_teams/session_juries, creates/updates room_sessions,
     * and creates room_session_teams and room_session_juries rows.
     *
     * @param id Session ID
     * @param requestBody
     * @returns string Session plan saved successfully
     * @throws ApiError
     */
    public static saveSessionPlan(
        id: number,
        requestBody: SessionPlan,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{id}/plan',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body or ID parameter`,
                500: `Internal server error (e.g., validation failed, IDs not found)`,
            },
        });
    }
}
