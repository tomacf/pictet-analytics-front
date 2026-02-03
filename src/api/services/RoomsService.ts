/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Room } from '../models/Room';
import type { RoomInput } from '../models/RoomInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoomsService {
    /**
     * Create a new room
     * Creates a new room with the provided label and max_size
     * @param requestBody
     * @returns Room Room created successfully
     * @throws ApiError
     */
    public static createRoom(
        requestBody: RoomInput,
    ): CancelablePromise<Room> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rooms',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all rooms
     * Retrieves a list of all rooms
     * @returns Room List of rooms
     * @throws ApiError
     */
    public static getAllRooms(): CancelablePromise<Array<Room>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rooms',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update an existing room
     * Updates a room with the provided information
     * @param requestBody
     * @returns Room Room updated successfully
     * @throws ApiError
     */
    public static updateRoom(
        requestBody: Room,
    ): CancelablePromise<Room> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/rooms',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a room by ID
     * Retrieves a specific room by its ID
     * @param id Room ID
     * @returns Room Room found
     * @throws ApiError
     */
    public static getRoomById(
        id: number,
    ): CancelablePromise<Room> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rooms/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Room not found`,
            },
        });
    }
    /**
     * Delete a room
     * Deletes a specific room by its ID
     * @param id Room ID
     * @returns void
     * @throws ApiError
     */
    public static deleteRoom(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/rooms/{id}',
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
