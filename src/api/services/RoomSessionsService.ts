/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoomSession } from '../models/RoomSession';
import type { RoomSessionExpanded } from '../models/RoomSessionExpanded';
import type { RoomSessionInput } from '../models/RoomSessionInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoomSessionsService {
    /**
     * Create a new room session
     * Creates a new room session linking a room to a session
     * @param requestBody
     * @returns RoomSession Room session created successfully
     * @throws ApiError
     */
    public static createRoomSession(
        requestBody: RoomSessionInput,
    ): CancelablePromise<RoomSession> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/room-sessions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all room sessions
     * Retrieves a list of all room sessions. Optionally expand related entities using the expand parameter.
     *
     * The expand parameter accepts comma-separated values to include related data:
     * - `room`: Include room details (id and label)
     * - `session`: Include session details (id and label)
     * - `teams`: Include teams associated with the room session
     * - `juries`: Include juries associated with the room session
     *
     * @param expand Comma-separated list of related entities to expand (room, session, teams, juries)
     * @returns any List of room sessions
     * @throws ApiError
     */
    public static getAllRoomSessions(
        expand?: string,
    ): CancelablePromise<Array<(RoomSession | RoomSessionExpanded)>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/room-sessions',
            query: {
                'expand': expand,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a room session by ID
     * Retrieves a specific room session by its ID. Optionally expand related entities using the expand parameter.
     *
     * The expand parameter accepts comma-separated values to include related data:
     * - `room`: Include room details (id and label)
     * - `session`: Include session details (id and label)
     * - `teams`: Include teams associated with the room session
     * - `juries`: Include juries associated with the room session
     *
     * @param id Room session ID
     * @param expand Comma-separated list of related entities to expand (room, session, teams, juries)
     * @returns any Room session found
     * @throws ApiError
     */
    public static getRoomSessionById(
        id: number,
        expand?: string,
    ): CancelablePromise<(RoomSession | RoomSessionExpanded)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/room-sessions/{id}',
            path: {
                'id': id,
            },
            query: {
                'expand': expand,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Room session not found`,
            },
        });
    }
    /**
     * Delete a room session
     * Deletes a specific room session by its ID
     * @param id Room session ID
     * @returns void
     * @throws ApiError
     */
    public static deleteRoomSession(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/room-sessions/{id}',
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
