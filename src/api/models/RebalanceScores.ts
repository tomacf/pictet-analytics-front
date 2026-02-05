/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RebalanceScores = {
    /**
     * Variance in waiting times across teams
     */
    wait_disparity: number;
    /**
     * Sum of historical team_vs_team counts for teams grouped in same slots
     */
    meeting_repeats: number;
    /**
     * Sum of historical team_jury counts for teams meeting juries
     */
    team_jury_repeats: number;
    /**
     * Penalty for teams using frequently-used rooms
     */
    room_diversity: number;
    /**
     * Weighted sum of all penalty scores
     */
    total_penalty: number;
};

