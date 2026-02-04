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
     * @returns Room Room created successfully
     * @throws ApiError
     */
    public static createRoom({
        requestBody,
    }: {
        requestBody: RoomInput,
    }): CancelablePromise<Room> {
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
     * Get a room by ID
     * Retrieves a specific room by its ID
     * @returns Room Room found
     * @throws ApiError
     */
    public static getRoomById({
        id,
    }: {
        /**
         * Room ID
         */
        id: number,
    }): CancelablePromise<Room> {
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
     * Update an existing room
     * Updates a room with the provided information. The ID is provided in the URL path, not in the request body.
     * @returns Room Room updated successfully
     * @throws ApiError
     */
    public static updateRoom({
        id,
        requestBody,
    }: {
        /**
         * Room ID
         */
        id: number,
        requestBody: RoomInput,
    }): CancelablePromise<Room> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/rooms/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body or ID parameter`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete a room
     * Deletes a specific room by its ID
     * @returns void
     * @throws ApiError
     */
    public static deleteRoom({
        id,
    }: {
        /**
         * Room ID
         */
        id: number,
    }): CancelablePromise<void> {
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
