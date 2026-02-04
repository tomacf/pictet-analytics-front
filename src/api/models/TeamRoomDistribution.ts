/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoomCount } from './RoomCount';
export type TeamRoomDistribution = {
    /**
     * Team ID
     */
    team_id: number;
    /**
     * Team label
     */
    team_label: string;
    /**
     * Count of room sessions per room
     */
    room_counts: Array<RoomCount>;
};

