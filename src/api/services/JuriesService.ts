/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Jury } from '../models/Jury';
import type { JuryInput } from '../models/JuryInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JuriesService {
    /**
     * Create a new jury
     * Creates a new jury with the provided name and email
     * @returns Jury Jury created successfully
     * @throws ApiError
     */
    public static createJury({
        requestBody,
    }: {
        requestBody: JuryInput,
    }): CancelablePromise<Jury> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/juries',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all juries
     * Retrieves a list of all juries
     * @returns Jury List of juries
     * @throws ApiError
     */
    public static getAllJuries(): CancelablePromise<Array<Jury>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/juries',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a jury by ID
     * Retrieves a specific jury by its ID
     * @returns Jury Jury found
     * @throws ApiError
     */
    public static getJuryById({
        id,
    }: {
        /**
         * Jury ID
         */
        id: number,
    }): CancelablePromise<Jury> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/juries/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Jury not found`,
            },
        });
    }
    /**
     * Update an existing jury
     * Updates a jury with the provided information. The ID is provided in the URL path, not in the request body.
     * @returns Jury Jury updated successfully
     * @throws ApiError
     */
    public static updateJury({
        id,
        requestBody,
    }: {
        /**
         * Jury ID
         */
        id: number,
        requestBody: JuryInput,
    }): CancelablePromise<Jury> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/juries/{id}',
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
     * Delete a jury
     * Deletes a specific jury by its ID
     * @returns void
     * @throws ApiError
     */
    public static deleteJury({
        id,
    }: {
        /**
         * Jury ID
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/juries/{id}',
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
