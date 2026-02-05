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
     * IDs of the juries assigned to this room for the session (empty array if no juries assigned)
     */
    jury_ids?: Array<number>;
    /**
     * Labels of the assigned juries (empty array if no juries assigned)
     */
    jury_labels?: Array<string>;
    /**
     * Timestamp when this room assignment was created
     */
    created_at?: string;
};

