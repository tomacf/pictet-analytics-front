/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RebalanceScores } from './RebalanceScores';
export type RebalanceReport = {
    before_scores: RebalanceScores;
    after_scores: RebalanceScores;
    /**
     * Whether the rebalancing improved the total penalty score
     */
    improved: boolean;
    /**
     * Number of local improvement iterations performed
     */
    iterations: number;
};

