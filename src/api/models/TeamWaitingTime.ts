/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionWaitingTime } from './SessionWaitingTime';
export type TeamWaitingTime = {
    /**
     * Team ID
     */
    team_id: number;
    /**
     * Team label
     */
    team_label: string;
    /**
     * Total waiting time across all sessions in minutes
     */
    total_waiting_time_minutes: number;
    /**
     * Average waiting time per session in minutes
     */
    average_waiting_time_minutes: number;
    /**
     * Per-session breakdown of waiting times
     */
    session_breakdown: Array<SessionWaitingTime>;
};

