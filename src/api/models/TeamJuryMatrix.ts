/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JuryLabel } from './JuryLabel';
import type { TeamJuryInteraction } from './TeamJuryInteraction';
import type { TeamLabel } from './TeamLabel';
export type TeamJuryMatrix = {
    /**
     * List of all teams that appear in the matrix
     */
    teams: Array<TeamLabel>;
    /**
     * List of all juries that appear in the matrix
     */
    juries: Array<JuryLabel>;
    /**
     * List of team-jury interaction counts
     */
    counts: Array<TeamJuryInteraction>;
    /**
     * Total number of room sessions per team (key is team ID)
     */
    per_team_totals: Record<string, number>;
    /**
     * Total number of room sessions per jury (key is jury ID)
     */
    per_jury_totals: Record<string, number>;
};

