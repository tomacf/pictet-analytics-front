/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RoomAssignment = {
    /**
     * Room ID
     */
    room_id: number;
    /**
     * Room label
     */
    room_label?: string;
    /**
     * ID of the jury assigned to this room for the session (null if no jury assigned)
     */
    jury_id?: number | null;
    /**
     * Label of the assigned jury (empty string if no jury assigned)
     */
    jury_label?: string;
    /**
     * Timestamp when this room assignment was created
     */
    created_at?: string;
};
