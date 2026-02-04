/**
 * Utility functions for validating scheduling conflicts
 */

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface SlotAssignment extends TimeSlot {
  teamIds: number[];
  juryIds: number[];
}

export interface TeamConflict {
  teamId: number;
  slotIndexes: number[];
}

export interface JuryConflict {
  juryId: number;
  conflictingSlots: Array<{ slotIndex: number; timeSlot: TimeSlot }>;
}

/**
 * Checks if two time slots overlap
 */
export const doTimeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  const start1 = new Date(slot1.startTime).getTime();
  const end1 = new Date(slot1.endTime).getTime();
  const start2 = new Date(slot2.startTime).getTime();
  const end2 = new Date(slot2.endTime).getTime();

  // Two slots overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
};

/**
 * Detects teams that are assigned to multiple slots in the same session
 * @param slots - Array of slot assignments
 * @returns Array of team conflicts
 */
export const detectTeamConflicts = (slots: SlotAssignment[]): TeamConflict[] => {
  const teamSlotMap = new Map<number, number[]>();

  // Build a map of teamId -> slot indexes where it appears
  slots.forEach((slot, index) => {
    slot.teamIds.forEach((teamId) => {
      if (!teamSlotMap.has(teamId)) {
        teamSlotMap.set(teamId, []);
      }
      teamSlotMap.get(teamId)!.push(index);
    });
  });

  // Find teams that appear in multiple slots
  const conflicts: TeamConflict[] = [];
  teamSlotMap.forEach((slotIndexes, teamId) => {
    if (slotIndexes.length > 1) {
      conflicts.push({ teamId, slotIndexes });
    }
  });

  return conflicts;
};

/**
 * Detects juries that are assigned to overlapping time slots
 * @param slots - Array of slot assignments
 * @returns Array of jury conflicts
 */
export const detectJuryConflicts = (slots: SlotAssignment[]): JuryConflict[] => {
  const juryConflictMap = new Map<number, Array<{ slotIndex: number; timeSlot: TimeSlot }>>();

  // For each jury, find all slots they're assigned to
  slots.forEach((slot, index) => {
    slot.juryIds.forEach((juryId) => {
      if (!juryConflictMap.has(juryId)) {
        juryConflictMap.set(juryId, []);
      }
      juryConflictMap.get(juryId)!.push({
        slotIndex: index,
        timeSlot: { startTime: slot.startTime, endTime: slot.endTime },
      });
    });
  });

  // For each jury, check if any of their slots overlap
  const conflicts: JuryConflict[] = [];
  juryConflictMap.forEach((jurySlots, juryId) => {
    if (jurySlots.length > 1) {
      // Check each pair of slots for overlap
      for (let i = 0; i < jurySlots.length; i++) {
        for (let j = i + 1; j < jurySlots.length; j++) {
          if (doTimeSlotsOverlap(jurySlots[i].timeSlot, jurySlots[j].timeSlot)) {
            // Found overlapping slots for this jury
            conflicts.push({
              juryId,
              conflictingSlots: jurySlots,
            });
            // Only add once per jury
            return;
          }
        }
      }
    }
  });

  return conflicts;
};

/**
 * Gets all team IDs that have conflicts
 */
export const getConflictingTeamIds = (conflicts: TeamConflict[]): Set<number> => {
  return new Set(conflicts.map((c) => c.teamId));
};

/**
 * Gets all jury IDs that have conflicts
 */
export const getConflictingJuryIds = (conflicts: JuryConflict[]): Set<number> => {
  return new Set(conflicts.map((c) => c.juryId));
};

/**
 * Checks if a specific team has a conflict
 */
export const isTeamConflicted = (teamId: number, conflicts: TeamConflict[]): boolean => {
  return conflicts.some((c) => c.teamId === teamId);
};

/**
 * Checks if a specific jury has a conflict
 */
export const isJuryConflicted = (juryId: number, conflicts: JuryConflict[]): boolean => {
  return conflicts.some((c) => c.juryId === juryId);
};
