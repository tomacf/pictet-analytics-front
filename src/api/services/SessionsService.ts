/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RebalancePlanResponse } from '../models/RebalancePlanResponse';
import type { RoomSessionExpanded } from '../models/RoomSessionExpanded';
import type { Session } from '../models/Session';
import type { SessionExpanded } from '../models/SessionExpanded';
import type { SessionInput } from '../models/SessionInput';
import type { SessionPlan } from '../models/SessionPlan';
import type { SessionUpdateRequest } from '../models/SessionUpdateRequest';
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
     * Retrieves a list of all sessions. Supports optional expansion of related data via the `expand` query parameter.
     *
     * **Expand Options:**
     * - `teams` - Include associated teams (id, label)
     * - `juries` - Include associated juries (id, label)
     * - `rooms` - Include associated rooms (id, label)
     * - `summary` - Include summary statistics (room_sessions_count, first_room_session_start_time, last_room_session_end_time)
     *
     * Multiple options can be combined using comma-separated values (e.g., `?expand=teams,juries,summary`)
     *
     * @param expand Comma-separated list of fields to expand (teams, juries, rooms, summary)
     * @returns any List of sessions
     * @throws ApiError
     */
    public static getAllSessions(
        expand?: string,
    ): CancelablePromise<Array<(Session | SessionExpanded)>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions',
            query: {
                'expand': expand,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a session by ID
     * Retrieves a specific session by its ID. Supports optional expansion of related data via the `expand` query parameter.
     *
     * **Expand Options:**
     * - `teams` - Include associated teams (id, label)
     * - `juries` - Include associated juries (id, label)
     * - `rooms` - Include associated rooms (id, label)
     * - `room_assignments` - Include room assignments with jury per room (room_id, room_label, jury_id, jury_label)
     * - `room_sessions` - Include all room sessions for this session with expanded room, teams, and juries
     * - `summary` - Include summary statistics (room_sessions_count, first_room_session_start_time, last_room_session_end_time)
     *
     * Multiple options can be combined using comma-separated values (e.g., `?expand=teams,juries,rooms,room_assignments`)
     *
     * @param id Session ID
     * @param expand Comma-separated list of fields to expand (teams, juries, rooms, room_assignments, room_sessions, summary)
     * @returns any Session found
     * @throws ApiError
     */
    public static getSessionById(
        id: number,
        expand?: string,
    ): CancelablePromise<(Session | SessionExpanded)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}',
            path: {
                'id': id,
            },
            query: {
                'expand': expand,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Update an existing session with optional scope relations
     * Updates a session with the provided information. The ID is provided in the URL path, not in the request body.
     *
     * **Scope Relations (Optional):**
     * You can optionally include `team_ids`, `jury_ids`, and `room_ids` arrays to manage session-level scope relations:
     * - When these arrays are provided, the session's scope relations are replaced transactionally
     * - Validates that all referenced IDs exist (returns 500 if not found)
     * - Prevents removing teams/juries/rooms that are used in room_sessions (returns 409 Conflict)
     * - Use `force: true` to override conflict protection and delete affected room_session relationships
     *
     * **Backward Compatibility:**
     * If `team_ids`, `jury_ids`, and `room_ids` are omitted, the endpoint behaves like the old simple update (only updates core session fields).
     *
     * @param id Session ID
     * @param requestBody
     * @returns any Session updated successfully
     * @throws ApiError
     */
    public static updateSession(
        id: number,
        requestBody: SessionUpdateRequest,
    ): CancelablePromise<(Session | SessionExpanded)> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sessions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body or ID parameter`,
                409: `Conflict - cannot remove teams/juries/rooms that are used in room sessions (use force=true to override)`,
                500: `Internal server error or validation error (e.g., non-existent team/jury/room IDs)`,
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
                409: `Scheduling constraint violated. This occurs when:
                - A team is assigned to multiple slots within the session
                - A jury is assigned to overlapping time ranges within the session
                `,
                500: `Internal server error (e.g., validation failed, IDs not found)`,
            },
        });
    }
    /**
     * Rebalance a session plan
     * Accepts a draft session plan and returns a rebalanced plan without persisting.
     * Uses historical analytics data (team meetings, waiting times, room usage, jury interactions)
     * to optimize the assignment of teams and juries to slots.
     *
     * The algorithm is deterministic (seeded with session_id) and respects constraints:
     * - Each team appears at most once in the plan
     * - No jury is assigned to overlapping time intervals
     * - Only teams/juries/rooms in the session scope are used
     *
     * Optimization priorities:
     * 1. Reduce waiting-time disparity (teams with high wait get earlier slots)
     * 2. Increase rare meetings (group teams that historically met least)
     * 3. Jury stability + fairness (room-anchored juries, minimize repeat interactions)
     * 4. Room diversity (penalize frequent room usage by teams)
     *
     * @param id Session ID (used as seed for deterministic algorithm)
     * @param requestBody
     * @returns RebalancePlanResponse Successfully rebalanced plan
     * @throws ApiError
     */
    public static rebalanceSessionPlan(
        id: number,
        requestBody: SessionPlan,
    ): CancelablePromise<RebalancePlanResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{id}/rebalance',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body, ID parameter, or plan scope violation`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Export session plan as PDF
     * Generates a PDF document summarizing the session plan.
     *
     * The PDF includes:
     * - Session label
     * - Date/time (EU format: DD/MM/YYYY HH:MM)
     * - Slot duration and gap between slots
     * - Table grouped by room with each slot showing:
     * - Start-end time
     * - Assigned teams
     * - Assigned juries
     *
     * The document is formatted for A4 paper with header and page numbers.
     *
     * @param id Session ID
     * @returns binary PDF document generated successfully
     * @throws ApiError
     */
    public static exportSessionPdf(
        id: number,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}/export.pdf',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Session not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create a room session for a session (Preferred)
     * **This is the preferred endpoint for creating room sessions scoped to a session.**
     *
     * Creates a new room session for a specific session, associating teams and juries.
     * - Validates that the room exists
     * - Validates that team_ids and jury_ids belong to the parent session
     * - Creates the room session with the specified parameters
     * - Associates teams and juries with the room session
     * - Returns the expanded room session (with room, session, teams, juries)
     *
     * **Note:** For backward compatibility, the legacy /api/room-sessions endpoint is still available.
     *
     * @param id Session ID
     * @param requestBody
     * @returns RoomSessionExpanded Room session created successfully
     * @throws ApiError
     */
    public static createRoomSessionForSession(
        id: number,
        requestBody: {
            /**
             * ID of the room
             */
            room_id: number;
            /**
             * Start time of the room session
             */
            start_time: string;
            /**
             * End time of the room session
             */
            end_time: string;
            /**
             * IDs of teams to associate with the room session (must be associated with the parent session)
             */
            team_ids?: Array<number>;
            /**
             * IDs of juries to associate with the room session (must be associated with the parent session)
             */
            jury_ids?: Array<number>;
        },
    ): CancelablePromise<RoomSessionExpanded> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{id}/room-sessions',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body or validation failure`,
                409: `Scheduling constraint violated. This occurs when:
                - A team is already assigned to another room session within the same session
                - A jury is already assigned to an overlapping time range within the same session
                `,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update a room session for a session (Preferred)
     * **This is the preferred endpoint for updating room sessions scoped to a session.**
     *
     * Updates an existing room session that belongs to a specific session.
     * - Verifies that the room session belongs to the specified session
     * - Validates that the room exists
     * - Validates that team_ids and jury_ids belong to the parent session
     * - Updates the room session with the specified parameters
     * - Performs a transactional replace of teams and juries associations
     * - Returns the expanded room session (with room, session, teams, juries)
     *
     * **Note:** For backward compatibility, the legacy /api/room-sessions/{id} endpoint is still available.
     *
     * @param id Session ID
     * @param roomSessionId Room session ID
     * @param requestBody
     * @returns RoomSessionExpanded Room session updated successfully
     * @throws ApiError
     */
    public static updateRoomSessionForSession(
        id: number,
        roomSessionId: number,
        requestBody: {
            /**
             * ID of the room
             */
            room_id: number;
            /**
             * Start time of the room session
             */
            start_time: string;
            /**
             * End time of the room session
             */
            end_time: string;
            /**
             * IDs of teams to associate with the room session (must be associated with the parent session)
             */
            team_ids?: Array<number>;
            /**
             * IDs of juries to associate with the room session (must be associated with the parent session)
             */
            jury_ids?: Array<number>;
        },
    ): CancelablePromise<RoomSessionExpanded> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sessions/{id}/room-sessions/{roomSessionId}',
            path: {
                'id': id,
                'roomSessionId': roomSessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body, validation failure, or room session doesn't belong to session`,
                404: `Room session not found`,
                409: `Scheduling constraint violated. This occurs when:
                - A team is already assigned to another room session within the same session
                - A jury is already assigned to an overlapping time range within the same session
                `,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete a room session for a session (Preferred)
     * **This is the preferred endpoint for deleting room sessions scoped to a session.**
     *
     * Deletes a room session that belongs to a specific session.
     * - Verifies that the room session belongs to the specified session
     * - Deletes the room session and all associated relationships (teams, juries)
     *
     * **Note:** For backward compatibility, the legacy /api/room-sessions/{id} endpoint is still available.
     *
     * @param id Session ID
     * @param roomSessionId Room session ID
     * @returns void
     * @throws ApiError
     */
    public static deleteRoomSessionForSession(
        id: number,
        roomSessionId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/sessions/{id}/room-sessions/{roomSessionId}',
            path: {
                'id': id,
                'roomSessionId': roomSessionId,
            },
            errors: {
                400: `Invalid ID parameter or room session doesn't belong to session`,
                404: `Room session not found`,
                500: `Internal server error`,
            },
        });
    }
}
