/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Team } from '../models/Team';
import type { TeamInput } from '../models/TeamInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamsService {
    /**
     * Create a new team
     * Creates a new team with the provided name
     * @param requestBody
     * @returns Team Team created successfully
     * @throws ApiError
     */
    public static createTeam(
        requestBody: TeamInput,
    ): CancelablePromise<Team> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/teams',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get all teams
     * Retrieves a list of all teams
     * @returns Team List of teams
     * @throws ApiError
     */
    public static getAllTeams(): CancelablePromise<Array<Team>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/teams',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update an existing team
     * Updates a team with the provided information. The ID is provided in the URL path, not in the request body.
     * @param id Team ID
     * @param requestBody
     * @returns Team Team updated successfully
     * @throws ApiError
     */
    public static updateTeam(
        id: number,
        requestBody: TeamInput,
    ): CancelablePromise<Team> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/teams/{id}',
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
     * Get a team by ID
     * Retrieves a specific team by its ID
     * @param id Team ID
     * @returns Team Team found
     * @throws ApiError
     */
    public static getTeamById(
        id: number,
    ): CancelablePromise<Team> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/teams/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid ID parameter`,
                404: `Team not found`,
            },
        });
    }
    /**
     * Delete a team
     * Deletes a specific team by its ID
     * @param id Team ID
     * @returns void
     * @throws ApiError
     */
    public static deleteTeam(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/teams/{id}',
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
