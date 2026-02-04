/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoomSession } from '../models/RoomSession';
import type { RoomSessionExpanded } from '../models/RoomSessionExpanded';
import type { RoomSessionInput } from '../models/RoomSessionInput';
import type { RoomSessionUpdateInput } from '../models/RoomSessionUpdateInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoomSessionsService {
    /**
     * Create a new room session (Legacy - use /api/sessions/{id}/room-sessions instead)
     * **Legacy endpoint - for new development, prefer /api/sessions/{id}/room-sessions**
     *
     * Creates a new room session linking a room to a session with optional teams and juries.
     *
     * When team_ids or jury_ids are provided:
     * - Creates the room session
     * - Associates teams and juries with the room session
     * - Automatically upserts into session_teams, session_juries, and session_rooms if the entities are not already linked to the parent session
     * - Returns the room session with expanded data (room, session, teams, juries)
     *
     * When team_ids and jury_ids are not provided:
     * - Creates a basic room session (backward compatible)
     * - Returns the room session without expanded data
     *
     * @param requestBody
     * @returns any Room session created successfully
     * @throws ApiError
     */
    public static createRoomSession(
        requestBody: RoomSessionInput,
    ): CancelablePromise<(RoomSession | RoomSessionExpanded)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/room-sessions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                409: `Scheduling constraint violated. This occurs when:
                - A team is already assigned to another room session within the same session
                - A jury is already assigned to an overlapping time range within the same session
                `,
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
     * Delete a room session (Legacy - use /api/sessions/{id}/room-sessions/{roomSessionId} instead)
     * **Legacy endpoint - for new development, prefer /api/sessions/{id}/room-sessions/{roomSessionId}**
     *
     * Deletes a specific room session by its ID
     *
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
    /**
     * Update a room session (Legacy - use /api/sessions/{id}/room-sessions/{roomSessionId} instead)
     * **Legacy endpoint - for new development, prefer /api/sessions/{id}/room-sessions/{roomSessionId}**
     *
     * Updates a room session with new room/time and replaces team/jury assignments in a transaction.
     *
     * This endpoint:
     * - Updates the room session with new room_id, session_id, start_time, and end_time
     * - Replaces all team and jury associations (removes old ones, adds new ones)
     * - Automatically upserts into session_teams, session_juries, and session_rooms if the entities are not already linked to the parent session
     * - Returns the updated room session with expanded data (room, session, teams, juries)
     *
     * @param id Room session ID
     * @param requestBody
     * @returns RoomSessionExpanded Room session updated successfully
     * @throws ApiError
     */
    public static updateRoomSession(
        id: number,
        requestBody: RoomSessionUpdateInput,
    ): CancelablePromise<RoomSessionExpanded> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/room-sessions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body or ID parameter`,
                404: `Room session not found`,
                409: `Scheduling constraint violated. This occurs when:
                - A team is already assigned to another room session within the same session
                - A jury is already assigned to an overlapping time range within the same session
                `,
                500: `Internal server error`,
            },
        });
    }
}
