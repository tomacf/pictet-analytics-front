/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DraftPlan } from '../models/DraftPlan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImportService {
    /**
     * Parse PDF session schedule
     * Parses a PDF file containing a session schedule table and returns a draft plan.
     * The PDF should contain a table with rooms, times, and team codes.
     *
     * **Features:**
     * - Deterministic text extraction (no OCR)
     * - Normalizes whitespace while preserving UTF-8 characters
     * - Extracts slot_duration from line "Durée et format de l'épreuve : XX minutes"
     * - Locates room header by finding all room labels from DB (in order, possibly on consecutive lines)
     * - Reads time slots (lines starting with HH:MM) and following team labels
     * - Extracts team labels using regex \b[A-Z]\d+\b
     * - Groups teams by room (handles multi-line cells and comma continuations)
     * - Derives time_between_slots from difference between first two start times minus duration
     * - Resolves room/team labels to IDs from database (case-insensitive)
     * - Auto-assigns juries round-robin with no overlap
     * - Returns draft plan without writing to database
     *
     * **Required fields:**
     * - `pdf`: PDF file (multipart/form-data)
     * - `date` or `day`: Schedule date (YYYY-MM-DD)
     * - `jury_ids[]`: Array of jury IDs to assign
     * - `juries_per_room`: Number of juries per room
     *
     * **Optional fields:**
     * - `session_label`: Label for the session
     * - `slot_duration`: Duration of each slot in minutes (parsed from PDF if not provided)
     * - `time_between_slots`: Gap between slots in minutes (derived from PDF if not provided)
     *
     * **Error Handling:**
     * - If parsed room or team labels are not found in database, returns HTTP 400 with structured error including missing labels and extracted schedule context
     *
     * @param formData
     * @returns DraftPlan PDF parsed successfully, returns draft plan
     * @throws ApiError
     */
    public static parseSessionDocument(
        formData: {
            /**
             * PDF file containing the session schedule
             */
            pdf: Blob;
            /**
             * Optional label for the session
             */
            session_label?: string;
            /**
             * Schedule date (YYYY-MM-DD)
             */
            date: string;
            /**
             * Alternative to 'date' field (YYYY-MM-DD)
             */
            day?: string;
            /**
             * Duration of each slot in minutes (optional - parsed from PDF if not provided)
             */
            slot_duration?: number;
            /**
             * Gap between slots in minutes (optional - derived from PDF schedule if not provided)
             */
            time_between_slots?: number;
            /**
             * Array of jury IDs to assign to slots
             */
            jury_ids: Array<number>;
            /**
             * Number of juries to assign per room
             */
            juries_per_room: number;
        },
    ): CancelablePromise<DraftPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/import/session-document/parse',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid request (missing required fields, invalid PDF, or missing rooms/teams in database)`,
                422: `PDF could not be parsed (no schedule data found)`,
                500: `Internal server error`,
            },
        });
    }
}
