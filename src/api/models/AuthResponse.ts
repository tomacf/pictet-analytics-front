/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthResponse = {
    user: {
        /**
         * User ID
         */
        id: number;
        /**
         * User email
         */
        email: string;
        /**
         * User creation timestamp
         */
        created_at: string;
        /**
         * User last update timestamp
         */
        updated_at: string;
    };
    session: {
        /**
         * Session token
         */
        token: string;
        /**
         * Session expiration timestamp
         */
        expires_at: string;
    };
};

