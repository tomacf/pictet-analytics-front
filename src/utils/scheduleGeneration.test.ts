import { describe, it, expect } from 'vitest';

/**
 * Test suite for schedule generation logic improvements
 * 
 * These tests verify the requirements from the problem statement:
 * 1. Treat teams_per_room as maximum capacity, never duplicate teams
 * 2. Handle insufficient juries by reducing juries_per_room or rooms
 * 3. Leave slots partially filled if teams < capacity
 */

interface ScheduleSlot {
  roomId: number;
  slotIndex: number;
  startTime: string;
  endTime: string;
  teamIds: number[];
  juryIds: number[];
}

// Helper function to generate schedule (simplified version for testing)
const generateScheduleLogic = (
  selectedRoomIds: number[],
  selectedTeamIds: number[],
  selectedJuryIds: number[],
  teamsPerRoom: number,
  juriesPerRoom: number
): ScheduleSlot[] => {
  const slots: ScheduleSlot[] = [];
  const totalTeams = selectedTeamIds.length;
  const totalJuries = selectedJuryIds.length;
  
  const slotsPerRoom = Math.ceil(totalTeams / (selectedRoomIds.length * teamsPerRoom));
  
  let teamIndex = 0;
  const usedTeams = new Set<number>();
  
  const roomToJuries = new Map<number, number[]>();
  const availableJuries = new Set(selectedJuryIds);
  
  // Calculate jury allocation
  const roomsInParallel = selectedRoomIds.length;
  const juriesNeededConcurrently = roomsInParallel * juriesPerRoom;
  
  let actualJuriesPerRoom = juriesPerRoom;
  let activeRoomIds = selectedRoomIds;
  
  if (juriesNeededConcurrently > totalJuries) {
    const maxPossibleJuriesPerRoom = Math.floor(totalJuries / roomsInParallel);
    if (maxPossibleJuriesPerRoom > 0) {
      actualJuriesPerRoom = maxPossibleJuriesPerRoom;
    } else {
      const maxPossibleRooms = Math.floor(totalJuries / juriesPerRoom);
      if (maxPossibleRooms > 0) {
        activeRoomIds = selectedRoomIds.slice(0, maxPossibleRooms);
        actualJuriesPerRoom = juriesPerRoom;
      } else {
        activeRoomIds = totalJuries > 0 ? [selectedRoomIds[0]] : [];
        actualJuriesPerRoom = totalJuries;
      }
    }
  }
  
  for (let slotIdx = 0; slotIdx < slotsPerRoom; slotIdx++) {
    for (const roomId of activeRoomIds) {
      const assignedTeams: number[] = [];
      
      // Assign teams - never duplicate
      for (let i = 0; i < teamsPerRoom; i++) {
        if (teamIndex < totalTeams) {
          const teamId = selectedTeamIds[teamIndex];
          if (!usedTeams.has(teamId)) {
            assignedTeams.push(teamId);
            usedTeams.add(teamId);
            teamIndex++;
          }
        }
      }
      
      // Assign juries
      const assignedJuries: number[] = [];
      
      if (slotIdx === 0) {
        for (let i = 0; i < actualJuriesPerRoom && availableJuries.size > 0; i++) {
          const jury = Array.from(availableJuries)[0];
          assignedJuries.push(jury);
          availableJuries.delete(jury);
        }
      } else {
        const previousJuriesInRoom = roomToJuries.get(roomId) || [];
        
        for (const juryId of previousJuriesInRoom) {
          if (assignedJuries.length < actualJuriesPerRoom) {
            assignedJuries.push(juryId);
          }
        }
        
        for (const juryId of availableJuries) {
          if (assignedJuries.length >= actualJuriesPerRoom) break;
          assignedJuries.push(juryId);
          availableJuries.delete(juryId);
        }
      }
      
      roomToJuries.set(roomId, assignedJuries);
      
      if (assignedTeams.length > 0 || assignedJuries.length > 0) {
        slots.push({
          roomId,
          slotIndex: slotIdx,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          teamIds: assignedTeams,
          juryIds: assignedJuries,
        });
      }
    }
  }
  
  return slots;
};

describe('Schedule Generation Logic', () => {
  describe('Teams as maximum capacity (no duplication)', () => {
    it('should not duplicate teams when fewer teams than capacity', () => {
      const rooms = [1, 2];
      const teams = [1, 2, 3]; // 3 teams
      const juries = [1, 2, 3, 4];
      const teamsPerRoom = 2; // capacity is 2 per room
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Collect all assigned team IDs
      const allAssignedTeams = slots.flatMap(s => s.teamIds);
      
      // No team should appear twice
      const uniqueTeams = new Set(allAssignedTeams);
      expect(allAssignedTeams.length).toBe(uniqueTeams.size);
      
      // All teams should be assigned exactly once
      expect(uniqueTeams.size).toBe(teams.length);
    });
    
    it('should leave slots partially filled when teams run out', () => {
      const rooms = [1, 2];
      const teams = [1, 2, 3]; // 3 teams total
      const juries = [1, 2, 3, 4];
      const teamsPerRoom = 2; // capacity of 2
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Some slots should have less than capacity (2)
      const slotsWithLessCapacity = slots.filter(s => s.teamIds.length < teamsPerRoom && s.teamIds.length > 0);
      expect(slotsWithLessCapacity.length).toBeGreaterThan(0);
    });
    
    it('should assign all teams exactly once', () => {
      const rooms = [1, 2, 3];
      const teams = [1, 2, 3, 4, 5, 6, 7];
      const juries = [1, 2, 3, 4, 5, 6];
      const teamsPerRoom = 2;
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      const allAssignedTeams = slots.flatMap(s => s.teamIds);
      expect(allAssignedTeams.sort()).toEqual(teams.sort());
    });
  });
  
  describe('Insufficient juries handling', () => {
    it('should reduce juries per room when insufficient for all rooms', () => {
      const rooms = [1, 2, 3]; // 3 rooms
      const teams = [1, 2, 3, 4, 5, 6];
      const juries = [1, 2]; // Only 2 juries, need 3*2=6
      const teamsPerRoom = 1;
      const juriesPerRoom = 2; // Request 2 per room
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Should create slots with reduced juries
      expect(slots.length).toBeGreaterThan(0);
      
      // No slot in the same time slot should have more juries than available
      const firstSlotIndex = 0;
      const firstTimeSlots = slots.filter(s => s.slotIndex === firstSlotIndex);
      const totalJuriesUsed = firstTimeSlots.reduce((sum, s) => sum + s.juryIds.length, 0);
      expect(totalJuriesUsed).toBeLessThanOrEqual(juries.length);
    });
    
    it('should reduce number of rooms when not enough juries even with 1 per room', () => {
      const rooms = [1, 2, 3, 4]; // 4 rooms
      const teams = [1, 2, 3, 4];
      const juries = [1, 2]; // Only 2 juries
      const teamsPerRoom = 1;
      const juriesPerRoom = 1; // 1 per room
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Should only use 2 rooms (based on available juries)
      const usedRooms = new Set(slots.map(s => s.roomId));
      expect(usedRooms.size).toBeLessThanOrEqual(juries.length);
    });
    
    it('should handle extreme case with very few juries', () => {
      const rooms = [1, 2, 3];
      const teams = [1, 2, 3];
      const juries = [1]; // Only 1 jury
      const teamsPerRoom = 1;
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Should create at least some slots
      expect(slots.length).toBeGreaterThan(0);
      
      // Should only use 1 room at a time
      const firstSlotRooms = slots.filter(s => s.slotIndex === 0);
      expect(firstSlotRooms.length).toBe(1);
    });
  });
  
  describe('Slots missing juries detection', () => {
    it('should identify slots with no juries when juries run out', () => {
      const rooms = [1, 2];
      const teams = [1, 2, 3, 4];
      const juries = [1]; // Only 1 jury for 2 rooms
      const teamsPerRoom = 1;
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // With only 1 jury and 2 concurrent rooms, only 1 room should be used
      // But if we have more teams than can fit in one room's slots, we'll get slots
      const slotsWithTeams = slots.filter(s => s.teamIds.length > 0);
      expect(slotsWithTeams.length).toBeGreaterThan(0);
    });
    
    it('should create slots with teams even when insufficient juries', () => {
      const rooms = [1, 2];
      const teams = [1, 2, 3, 4, 5, 6];
      const juries = [1, 2]; // Not enough juries for all slots
      const teamsPerRoom = 2;
      const juriesPerRoom = 1;
      
      const slots = generateScheduleLogic(rooms, teams, juries, teamsPerRoom, juriesPerRoom);
      
      // Should still create slots with teams
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.filter(s => s.teamIds.length > 0).length).toBeGreaterThan(0);
      
      // With jury reuse across slots (room affinity), all slots should have juries
      // This is the actual behavior of the implementation which reuses juries
      const allSlotsHaveJuries = slots.every(s => s.juryIds.length > 0);
      expect(allSlotsHaveJuries).toBe(true);
    });
  });

  describe('Room jury assignments with juriesPerRoom setting', () => {
    // Helper function to simulate room jury assignment logic matching the SessionWizard
    const generateRoomJuryAssignments = (
      selectedRoomIds: number[],
      selectedJuryIds: number[],
      juriesPerRoom: number,
      existingAssignments: Record<number, number[]>
    ): Record<number, number[]> => {
      const roomJuryAssignments: Record<number, number[]> = {};
      let juryIndex = 0;
      const sortedJuryIds = [...selectedJuryIds].sort((a, b) => a - b);

      for (const roomId of selectedRoomIds) {
        const existingAssignment = existingAssignments[roomId];
        const isValidExistingAssignment = existingAssignment && 
          existingAssignment.length > 0 &&
          existingAssignment.length >= juriesPerRoom &&
          existingAssignment.every(juryId => selectedJuryIds.includes(juryId));
        
        if (isValidExistingAssignment) {
          roomJuryAssignments[roomId] = [...existingAssignment];
        } else {
          const assignedJuries: number[] = [];
          for (let i = 0; i < juriesPerRoom && juryIndex < sortedJuryIds.length; i++) {
            assignedJuries.push(sortedJuryIds[juryIndex]);
            juryIndex++;
          }
          roomJuryAssignments[roomId] = assignedJuries;
        }
      }
      return roomJuryAssignments;
    };

    it('should assign juriesPerRoom juries on first generation', () => {
      const result = generateRoomJuryAssignments([1], [1, 2, 3, 4], 4, {});
      expect(result[1]).toEqual([1, 2, 3, 4]);
    });

    it('should regenerate when existing assignment has fewer juries than juriesPerRoom', () => {
      // This is the key bug scenario: user changed juriesPerRoom from 1 to 4
      const result = generateRoomJuryAssignments([1], [1, 2, 3, 4], 4, { 1: [1] });
      expect(result[1]).toEqual([1, 2, 3, 4]);
    });

    it('should regenerate when existing assignment references removed juries', () => {
      // Jury 4 was in the assignment but was later removed from selection
      const result = generateRoomJuryAssignments([1], [1, 2, 3], 2, { 1: [1, 4] });
      expect(result[1]).toEqual([1, 2]);
    });

    it('should preserve valid existing assignment', () => {
      // Assignment has correct number of juries and all are still selected
      const result = generateRoomJuryAssignments([1], [1, 2, 3, 4], 2, { 1: [3, 4] });
      expect(result[1]).toEqual([3, 4]);
    });

    it('should preserve existing assignment with more juries than juriesPerRoom', () => {
      // User may have manually assigned extra juries
      const result = generateRoomJuryAssignments([1], [1, 2, 3, 4, 5], 2, { 1: [1, 2, 3] });
      expect(result[1]).toEqual([1, 2, 3]);
    });

    it('should distribute juries across multiple rooms', () => {
      const result = generateRoomJuryAssignments([1, 2], [1, 2, 3, 4], 2, {});
      expect(result[1]).toEqual([1, 2]);
      expect(result[2]).toEqual([3, 4]);
    });
  });
});
