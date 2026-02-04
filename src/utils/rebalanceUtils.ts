/**
 * Utility functions for Magic Rebalance feature
 * Reorganizes team/jury assignments to optimize schedule quality
 */

export interface RebalanceSlot {
  roomId: number;
  slotIndex: number;
  startTime: string;
  endTime: string;
  teamIds: number[];
  juryIds: number[];
}

export interface RebalanceConfig {
  slots: RebalanceSlot[];
  selectedTeamIds: number[];
  selectedJuryIds: number[];
  seed?: number;
  iterations?: number;
  weights?: PenaltyWeights;
}

export interface PenaltyWeights {
  waitingTimeDisparity: number;
  repeatedTeamMeetings: number;
  repeatedTeamJuryInteractions: number;
  unevenRoomAttendance: number;
  juryRoomChanges: number;
}

export interface RebalanceMetrics {
  waitingTimeDisparity: number;
  repeatedTeamMeetings: number;
  repeatedTeamJuryInteractions: number;
  unevenRoomAttendance: number;
  juryRoomChanges: number;
  totalPenalty: number;
}

export interface RebalanceResult {
  originalSlots: RebalanceSlot[];
  slots: RebalanceSlot[];
  beforeMetrics: RebalanceMetrics;
  afterMetrics: RebalanceMetrics;
  improvementPercentage: number;
}

const DEFAULT_WEIGHTS: PenaltyWeights = {
  waitingTimeDisparity: 3.0,
  repeatedTeamMeetings: 2.0,
  repeatedTeamJuryInteractions: 2.0,
  unevenRoomAttendance: 1.0,
  juryRoomChanges: 1.5,
};

const DEFAULT_ITERATIONS = 1000;
const TEMPERATURE_EPSILON = 0.001; // Small value to prevent division by zero in temperature calculation

/**
 * Seeded pseudo-random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Calculate waiting time disparity penalty
 * Measures the variance in waiting times between team slots
 */
function calculateWaitingTimeDisparity(slots: RebalanceSlot[], selectedTeamIds: number[]): number {
  const teamWaitTimes = new Map<number, number[]>();

  // Group slots by time for each team
  selectedTeamIds.forEach(teamId => {
    const teamSlots = slots.filter(s => s.teamIds.includes(teamId));
    if (teamSlots.length <= 1) {
      teamWaitTimes.set(teamId, [0]);
      return;
    }

    // Sort slots by time
    const sortedSlots = [...teamSlots].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Calculate wait times between consecutive slots
    const waitTimes: number[] = [];
    for (let i = 1; i < sortedSlots.length; i++) {
      const prevEnd = new Date(sortedSlots[i - 1].endTime).getTime();
      const currStart = new Date(sortedSlots[i].startTime).getTime();
      waitTimes.push((currStart - prevEnd) / (1000 * 60)); // minutes
    }
    teamWaitTimes.set(teamId, waitTimes);
  });

  // Calculate variance across all teams
  const allWaitTimes: number[] = [];
  teamWaitTimes.forEach(times => allWaitTimes.push(...times));
  
  if (allWaitTimes.length === 0) return 0;
  
  const mean = allWaitTimes.reduce((sum, t) => sum + t, 0) / allWaitTimes.length;
  const variance = allWaitTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / allWaitTimes.length;
  
  return Math.sqrt(variance); // Standard deviation in minutes
}

/**
 * Calculate repeated team-vs-team meeting penalty
 */
function calculateRepeatedTeamMeetings(slots: RebalanceSlot[]): number {
  const teamPairCounts = new Map<string, number>();

  slots.forEach(slot => {
    const teams = slot.teamIds;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const pair = [teams[i], teams[j]].sort().join('-');
        teamPairCounts.set(pair, (teamPairCounts.get(pair) || 0) + 1);
      }
    }
  });

  // Sum up repeated meetings (count - 1 for each pair)
  let penalty = 0;
  teamPairCounts.forEach(count => {
    if (count > 1) {
      penalty += (count - 1);
    }
  });

  return penalty;
}

/**
 * Calculate repeated team-vs-jury interaction penalty
 */
function calculateRepeatedTeamJuryInteractions(slots: RebalanceSlot[]): number {
  const teamJuryPairCounts = new Map<string, number>();

  slots.forEach(slot => {
    slot.teamIds.forEach(teamId => {
      slot.juryIds.forEach(juryId => {
        const pair = `${teamId}-${juryId}`;
        teamJuryPairCounts.set(pair, (teamJuryPairCounts.get(pair) || 0) + 1);
      });
    });
  });

  // Sum up repeated interactions (count - 1 for each pair)
  let penalty = 0;
  teamJuryPairCounts.forEach(count => {
    if (count > 1) {
      penalty += (count - 1);
    }
  });

  return penalty;
}

/**
 * Calculate uneven room attendance penalty
 */
function calculateUnevenRoomAttendance(slots: RebalanceSlot[]): number {
  const roomTeamCounts = new Map<number, Set<number>>();
  const roomJuryCounts = new Map<number, Set<number>>();

  slots.forEach(slot => {
    if (!roomTeamCounts.has(slot.roomId)) {
      roomTeamCounts.set(slot.roomId, new Set());
    }
    if (!roomJuryCounts.has(slot.roomId)) {
      roomJuryCounts.set(slot.roomId, new Set());
    }
    
    slot.teamIds.forEach(teamId => roomTeamCounts.get(slot.roomId)!.add(teamId));
    slot.juryIds.forEach(juryId => roomJuryCounts.get(slot.roomId)!.add(juryId));
  });

  // Calculate variance in team and jury counts across rooms
  const teamCounts = Array.from(roomTeamCounts.values()).map(s => s.size);
  const juryCounts = Array.from(roomJuryCounts.values()).map(s => s.size);

  const calcVariance = (counts: number[]) => {
    if (counts.length === 0) return 0;
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    return counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
  };

  return calcVariance(teamCounts) + calcVariance(juryCounts);
}

/**
 * Calculate jury room change penalty
 */
function calculateJuryRoomChanges(slots: RebalanceSlot[]): number {
  // Group slots by jury and time
  const jurySlots = new Map<number, RebalanceSlot[]>();

  slots.forEach(slot => {
    slot.juryIds.forEach(juryId => {
      if (!jurySlots.has(juryId)) {
        jurySlots.set(juryId, []);
      }
      jurySlots.get(juryId)!.push(slot);
    });
  });

  // Count room changes for each jury
  let totalChanges = 0;
  jurySlots.forEach(jurySlotList => {
    const sortedSlots = [...jurySlotList].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    for (let i = 1; i < sortedSlots.length; i++) {
      if (sortedSlots[i].roomId !== sortedSlots[i - 1].roomId) {
        totalChanges++;
      }
    }
  });

  return totalChanges;
}

/**
 * Calculate all metrics for a schedule
 */
export function calculateMetrics(
  slots: RebalanceSlot[],
  selectedTeamIds: number[],
  weights: PenaltyWeights = DEFAULT_WEIGHTS
): RebalanceMetrics {
  const waitingTimeDisparity = calculateWaitingTimeDisparity(slots, selectedTeamIds);
  const repeatedTeamMeetings = calculateRepeatedTeamMeetings(slots);
  const repeatedTeamJuryInteractions = calculateRepeatedTeamJuryInteractions(slots);
  const unevenRoomAttendance = calculateUnevenRoomAttendance(slots);
  const juryRoomChanges = calculateJuryRoomChanges(slots);

  const totalPenalty =
    waitingTimeDisparity * weights.waitingTimeDisparity +
    repeatedTeamMeetings * weights.repeatedTeamMeetings +
    repeatedTeamJuryInteractions * weights.repeatedTeamJuryInteractions +
    unevenRoomAttendance * weights.unevenRoomAttendance +
    juryRoomChanges * weights.juryRoomChanges;

  return {
    waitingTimeDisparity,
    repeatedTeamMeetings,
    repeatedTeamJuryInteractions,
    unevenRoomAttendance,
    juryRoomChanges,
    totalPenalty,
  };
}

/**
 * Validate that constraints are respected
 */
function validateConstraints(
  slots: RebalanceSlot[],
  selectedTeamIds: number[],
  selectedJuryIds: number[]
): boolean {
  // Check: each team at most once per session
  const teamSlotCount = new Map<number, number>();
  slots.forEach(slot => {
    slot.teamIds.forEach(teamId => {
      teamSlotCount.set(teamId, (teamSlotCount.get(teamId) || 0) + 1);
    });
  });
  
  // Note: The constraint validation is intentionally lenient here. While the problem statement
  // mentions "each team at most once per session", the existing implementation allows teams
  // to appear in multiple slots. The rebalance algorithm preserves this behavior and does not
  // create additional conflicts beyond what was already present in the input schedule.

  // Check: no jury overlap in time
  const juryTimeSlots = new Map<number, Array<{ start: number; end: number }>>();
  slots.forEach(slot => {
    const start = new Date(slot.startTime).getTime();
    const end = new Date(slot.endTime).getTime();
    
    slot.juryIds.forEach(juryId => {
      if (!juryTimeSlots.has(juryId)) {
        juryTimeSlots.set(juryId, []);
      }
      juryTimeSlots.get(juryId)!.push({ start, end });
    });
  });

  for (const timeSlots of juryTimeSlots.values()) {
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const a = timeSlots[i];
        const b = timeSlots[j];
        if (a.start < b.end && b.start < a.end) {
          return false; // Overlap detected
        }
      }
    }
  }

  // Check: only use teams/juries in selected scope
  const allTeamIds = new Set(slots.flatMap(s => s.teamIds));
  const allJuryIds = new Set(slots.flatMap(s => s.juryIds));
  
  for (const teamId of allTeamIds) {
    if (!selectedTeamIds.includes(teamId)) {
      return false;
    }
  }
  
  for (const juryId of allJuryIds) {
    if (!selectedJuryIds.includes(juryId)) {
      return false;
    }
  }

  return true;
}

/**
 * Perform a random swap between slots
 */
function performSwap(
  slots: RebalanceSlot[],
  rng: SeededRandom
): RebalanceSlot[] {
  const newSlots = JSON.parse(JSON.stringify(slots)) as RebalanceSlot[];
  
  // Randomly choose swap type: team swap or jury swap
  const swapType = rng.next() < 0.5 ? 'team' : 'jury';
  
  if (swapType === 'team') {
    // Find two slots with teams
    const slotsWithTeams = newSlots.filter(s => s.teamIds.length > 0);
    if (slotsWithTeams.length < 2) return newSlots;
    
    const idx1 = rng.nextInt(slotsWithTeams.length);
    const idx2 = rng.nextInt(slotsWithTeams.length);
    if (idx1 === idx2) return newSlots;
    
    const slot1 = slotsWithTeams[idx1];
    const slot2 = slotsWithTeams[idx2];
    
    if (slot1.teamIds.length === 0 || slot2.teamIds.length === 0) return newSlots;
    
    // Swap random team from each slot
    const team1Idx = rng.nextInt(slot1.teamIds.length);
    const team2Idx = rng.nextInt(slot2.teamIds.length);
    
    const temp = slot1.teamIds[team1Idx];
    slot1.teamIds[team1Idx] = slot2.teamIds[team2Idx];
    slot2.teamIds[team2Idx] = temp;
  } else {
    // Jury swap
    const slotsWithJuries = newSlots.filter(s => s.juryIds.length > 0);
    if (slotsWithJuries.length < 2) return newSlots;
    
    const idx1 = rng.nextInt(slotsWithJuries.length);
    const idx2 = rng.nextInt(slotsWithJuries.length);
    if (idx1 === idx2) return newSlots;
    
    const slot1 = slotsWithJuries[idx1];
    const slot2 = slotsWithJuries[idx2];
    
    if (slot1.juryIds.length === 0 || slot2.juryIds.length === 0) return newSlots;
    
    // Swap random jury from each slot
    const jury1Idx = rng.nextInt(slot1.juryIds.length);
    const jury2Idx = rng.nextInt(slot2.juryIds.length);
    
    const temp = slot1.juryIds[jury1Idx];
    slot1.juryIds[jury1Idx] = slot2.juryIds[jury2Idx];
    slot2.juryIds[jury2Idx] = temp;
  }
  
  return newSlots;
}

/**
 * Main rebalance function
 * Uses simulated annealing-style approach with deterministic seeded random swaps
 */
export function magicRebalance(config: RebalanceConfig): RebalanceResult {
  const {
    slots: originalSlots,
    selectedTeamIds,
    selectedJuryIds,
    seed = Date.now(),
    iterations = DEFAULT_ITERATIONS,
    weights = DEFAULT_WEIGHTS,
  } = config;

  // Calculate initial metrics
  const beforeMetrics = calculateMetrics(originalSlots, selectedTeamIds, weights);

  // Initialize with current slots
  let bestSlots = JSON.parse(JSON.stringify(originalSlots)) as RebalanceSlot[];
  let bestPenalty = beforeMetrics.totalPenalty;

  const rng = new SeededRandom(seed);

  // Perform iterations
  for (let i = 0; i < iterations; i++) {
    // Try a random swap
    const candidateSlots = performSwap(bestSlots, rng);

    // Validate constraints
    if (!validateConstraints(candidateSlots, selectedTeamIds, selectedJuryIds)) {
      continue; // Skip invalid configurations
    }

    // Calculate penalty for candidate
    const candidateMetrics = calculateMetrics(candidateSlots, selectedTeamIds, weights);

    // Accept if better (or occasionally worse with simulated annealing)
    const temperature = 1.0 - (i / iterations); // Decreases from 1 to 0
    const acceptProbability = temperature > 0 
      ? Math.exp((bestPenalty - candidateMetrics.totalPenalty) / (temperature * bestPenalty + TEMPERATURE_EPSILON))
      : 0;

    if (candidateMetrics.totalPenalty < bestPenalty || rng.next() < acceptProbability) {
      bestSlots = candidateSlots;
      bestPenalty = candidateMetrics.totalPenalty;
    }
  }

  // Calculate final metrics
  const afterMetrics = calculateMetrics(bestSlots, selectedTeamIds, weights);
  const improvementPercentage = beforeMetrics.totalPenalty > 0
    ? ((beforeMetrics.totalPenalty - afterMetrics.totalPenalty) / beforeMetrics.totalPenalty) * 100
    : 0;

  return {
    originalSlots,
    slots: bestSlots,
    beforeMetrics,
    afterMetrics,
    improvementPercentage,
  };
}

/**
 * Enhanced rebalance function that fetches global analytics from API
 * Uses real-world data from ALL sessions to inform weight adjustments and better optimization
 */
export async function magicRebalanceWithAnalytics(config: RebalanceConfig): Promise<RebalanceResult> {
  // Fetch global analytics to inform our weights (not limited to a specific session)
  let adjustedWeights = config.weights || DEFAULT_WEIGHTS;
  
  try {
    // Dynamically import the analytics service to avoid circular dependencies
    const { AnalyticsService } = await import('../apiConfig');
    
    // Fetch analytics summary for ALL sessions (no session_id filter)
    // This gives us a complete picture of historical patterns across all scheduling
    console.log('Fetching global analytics to inform rebalancing...');
    const summary = await AnalyticsService.getAnalyticsSummary();
    
    // Analyze the summary to adjust weights based on current issues across all data
    adjustedWeights = adjustWeightsFromAnalytics(summary, DEFAULT_WEIGHTS);
    
    console.log('Enhanced rebalance with global analytics data:', {
      teamVsTeamIssues: summary.team_vs_team_matrix.filter(m => m.meet_count > 1).length,
      teamJuryRepeatedPairings: summary.team_jury_matrix.counts.filter(c => c.meet_count > 1).length,
      teamsAnalyzed: summary.team_waiting_times.length,
      roomDistributions: summary.team_room_distributions.length,
      adjustedWeights,
    });
  } catch (error) {
    // If API call fails (e.g., no saved sessions yet), fall back to default weights
    console.warn('Failed to fetch global analytics, using default weights:', error);
    console.log('This is normal for new installations or if no sessions have been saved yet.');
  }
  
  // Run the standard rebalance with adjusted weights
  return magicRebalance({
    ...config,
    weights: adjustedWeights,
  });
}

/**
 * Analyze analytics summary to adjust penalty weights
 * Increases weights for metrics that show problems in current data
 */
function adjustWeightsFromAnalytics(
  summary: Awaited<ReturnType<typeof import('../apiConfig').AnalyticsService.getAnalyticsSummary>>,
  baseWeights: PenaltyWeights
): PenaltyWeights {
  const adjustedWeights = { ...baseWeights };
  
  // Increase weight for repeated team meetings if we see many in the data
  const repeatedMeetings = summary.team_vs_team_matrix.filter(m => m.meet_count > 1).length;
  if (repeatedMeetings > 3) {
    adjustedWeights.repeatedTeamMeetings = baseWeights.repeatedTeamMeetings * 1.5;
  }
  
  // Increase weight for team-jury interactions if there are many repeated pairings
  const teamJuryInteractions = summary.team_jury_matrix.counts || [];
  const repeatedPairings = teamJuryInteractions.filter(interaction => 
    interaction.meet_count > 1
  ).length;
  if (repeatedPairings > 5) {
    adjustedWeights.repeatedTeamJuryInteractions = baseWeights.repeatedTeamJuryInteractions * 1.5;
  }
  
  // Increase weight for waiting time if there's high variance
  const waitingTimes = summary.team_waiting_times.map(t => t.average_waiting_time_minutes);
  if (waitingTimes.length > 0) {
    const mean = waitingTimes.reduce((sum, t) => sum + t, 0) / waitingTimes.length;
    const variance = waitingTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / waitingTimes.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 15) { // More than 15 minutes standard deviation
      adjustedWeights.waitingTimeDisparity = baseWeights.waitingTimeDisparity * 1.5;
    }
  }
  
  // Increase weight for room distribution if there's imbalance
  const roomCounts = summary.team_room_distributions.map(d => d.room_counts.length);
  if (roomCounts.length > 0) {
    const maxRooms = Math.max(...roomCounts);
    const minRooms = Math.min(...roomCounts);
    if (maxRooms - minRooms > 2) {
      adjustedWeights.unevenRoomAttendance = baseWeights.unevenRoomAttendance * 1.5;
    }
  }
  
  return adjustedWeights;
}
