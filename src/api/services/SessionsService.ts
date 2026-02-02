/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Session } from '../models/Session';
import type { SessionInput } from '../models/SessionInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SessionsService {
    /**
     * Create a new session
     * Creates a new session between a team and jury with start and end times
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
     * Updates a session with the provided information
     * @param requestBody
     * @returns Session Session updated successfully
     * @throws ApiError
     */
    public static updateSession(
        requestBody: Session,
    ): CancelablePromise<Session> {
        return __request(OpenAPI, {
            method: 'PUT',
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
}
