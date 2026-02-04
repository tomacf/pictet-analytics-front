/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtractedSlotInfo } from './ExtractedSlotInfo';
export type ImportError = {
    /**
     * Error message
     */
    message: string;
    /**
     * Array of room labels that were not found in the database
     */
    missing_rooms?: Array<string>;
    /**
     * Array of team labels that were not found in the database
     */
    missing_teams?: Array<string>;
    /**
     * Context about what was extracted from the PDF
     */
    extracted_slots?: Array<ExtractedSlotInfo>;
};

