/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type {CancelablePromise} from '../core/CancelablePromise';
import {OpenAPI} from '../core/OpenAPI';
import {request as __request} from '../core/request';
export class PrinterService {
    /**
     * Generate stamped PDF for multiple teams
     * Uploads a PDF file, stamps it with team labels for each selected team,
     * and returns a merged PDF containing stamped copies for all teams.
     *
     * This is an operations tool for printing: each team gets their own stamped copy.
     *
     * @param formData
     * @returns binary Merged stamped PDF generated successfully
     * @throws ApiError
     */
    public static generatePrinterPdf(
        formData: {
            /**
             * PDF file to be stamped
             */
            pdf: Blob;
            /**
             * Array of team IDs to stamp the PDF for
             */
            team_ids: Array<number>;
            /**
             * Font size for the stamp (optional, default 12)
             */
            font_size?: number;
            /**
             * Top margin in points (optional, default 50)
             */
            top_margin?: number;
            /**
             * Right margin in points (optional, default 50)
             */
            right_margin?: number;
        },
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer',
            formData: formData,
            mediaType: 'multipart/form-data',
            responseType: 'blob',
            errors: {
                400: `Invalid request (missing PDF or team IDs)`,
                500: `Internal server error`,
            },
        });
    }
}
