/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponse } from '../models/AuthResponse';
import type { SignInRequest } from '../models/SignInRequest';
import type { SignUpRequest } from '../models/SignUpRequest';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Sign up a new user
     * Creates a new user account and returns a session cookie
     * @param requestBody
     * @returns AuthResponse User created successfully
     * @throws ApiError
     */
    public static signUp(
        requestBody: SignUpRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signup',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                409: `Email already exists`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Sign in an existing user
     * Authenticates a user and returns a session cookie
     * @param requestBody
     * @returns AuthResponse User authenticated successfully
     * @throws ApiError
     */
    public static signIn(
        requestBody: SignInRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signin',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                401: `Invalid credentials`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Sign out the current user
     * Invalidates the session and clears the session cookie
     * @returns void
     * @throws ApiError
     */
    public static signOut(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signout',
            errors: {
                401: `No session found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get current user
     * Returns the currently authenticated user's information
     * @returns UserResponse Current user information
     * @throws ApiError
     */
    public static getCurrentUser(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get user profile
     * Returns the current user's profile (alias for /api/auth/me)
     * @returns UserResponse User profile
     * @throws ApiError
     */
    public static getUserProfile(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
}
