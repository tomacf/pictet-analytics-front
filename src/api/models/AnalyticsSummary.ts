/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamPairMeeting } from './TeamPairMeeting';
import type { TeamRoomDistribution } from './TeamRoomDistribution';
import type { TeamWaitingTime } from './TeamWaitingTime';
export type AnalyticsSummary = {
    /**
     * Matrix showing how many times each pair of teams met in the same room session
     */
    team_vs_team_matrix: Array<TeamPairMeeting>;
    /**
     * Waiting time statistics for each team
     */
    team_waiting_times: Array<TeamWaitingTime>;
    /**
     * Room usage distribution for each team
     */
    team_room_distributions: Array<TeamRoomDistribution>;
};

