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
    /**
     * Inspect and validate PDF schedule document
     * **Document Inspector** validates a PDF schedule against expected teams and rules.
     * This is event-critical: correctness, determinism, and clear errors matter more than features.
     *
     * **Features:**
     * - Parses PDF schedule (rooms, slots, distribution times)
     * - Validates team presence, uniqueness, and distribution ordering
     * - Returns deterministic, explainable validation report
     * - Provides normalized preview for diffing/trust UI
     *
     * **Validation Rules:**
     * - **A) Team presence & uniqueness:** All expected teams must appear exactly once
     * - **B) Slot structure:** Slots must have consistent room counts
     * - **C) Distribution matching:** Distribution groups must match start time groups
     * - **D) Distribution ordering:** Earlier distribution → earlier or equal start time
     * - **E) Slot duration:** Gaps between slots must match declared duration
     *
     * **Request Format:**
     * - `pdf`: PDF file (multipart/form-data)
     * - `request`: JSON with expectedTeams, optional strictMode, knownRooms, expectedRoomCount
     *
     * **Response includes:**
     * - `extracted`: Raw data from PDF (rooms, slots, distributions, declared duration)
     * - `report`: Errors, warnings, and statistics
     * - `normalizedPreview`: Stable canonical representation for diffing
     *
     * **Error Codes:**
     * - `TEAM_MISSING`: Expected team not found in schedule
     * - `TEAM_DUPLICATE`: Team appears more than once
     * - `TEAM_UNEXPECTED`: Team in PDF but not in expectedTeams
     * - `SLOT_ROW_MALFORMED`: Slot has inconsistent room count or no teams
     * - `DISTRIBUTION_ORDER_MISMATCH`: Distribution/start time ordering violated
     * - `DISTRIBUTION_GROUP_MISMATCH`: Distribution groups don't match start groups
     * - `TEAM_DISTRIBUTION_START_INVERSION`: Team received later but starts earlier
     * - `SLOT_DURATION_MISMATCH`: Slot gaps don't match declared duration
     * - `PARSE_FAILED`: Could not parse PDF structure
     *
     * @param formData
     * @returns any Document inspection completed
     * @throws ApiError
     */
    public static inspectDocument(
        formData: {
            /**
             * PDF file containing the schedule to validate
             */
            pdf: Blob;
            /**
             * JSON string with validation parameters
             */
            request: string;
        },
    ): CancelablePromise<{
        /**
         * Raw data extracted from PDF
         */
        extracted: {
            rooms?: Array<string>;
            slots?: Array<{
                startTime?: string;
                roomLabel?: string;
                teams?: Array<string>;
            }>;
            distributions?: Array<{
                distributionTime?: string;
                teams?: Array<string>;
            }>;
            declaredSlotDurationMinutes?: number;
            declaredEndTime?: string;
        };
        /**
         * Validation report with errors and warnings
         */
        report: {
            errors?: Array<{
                code?: string;
                severity?: string;
                message?: string;
                path?: string | null;
                evidence?: Record<string, any>;
            }>;
            warnings?: Array<{
                code?: string;
                severity?: string;
                message?: string;
            }>;
            stats?: {
                expectedTeamsCount?: number;
                foundTeamsCount?: number;
                missingCount?: number;
                duplicateCount?: number;
                unexpectedCount?: number;
                slotCount?: number;
                roomsCount?: number;
            };
        };
        /**
         * Stable canonical representation for diffing
         */
        normalizedPreview: {
            slots?: Array<{
                startTime?: string;
                roomLabel?: string;
                /**
                 * Sorted team list
                 */
                teams?: Array<string>;
            }>;
            distributions?: Array<{
                distributionTime?: string;
                /**
                 * Sorted team list
                 */
                teams?: Array<string>;
            }>;
            metadata?: {
                slotDurationMinutes?: number;
                parsedAt?: string;
                totalTeams?: number;
                totalRooms?: number;
                totalSlots?: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/document-inspector',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid request (missing PDF, invalid JSON, empty expectedTeams)`,
                500: `Internal server error`,
            },
        });
    }
}
