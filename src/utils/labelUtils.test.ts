import { describe, it, expect } from 'vitest';
import { compareLabelsAlphanumeric, generateDuplicateLabel } from './labelUtils';

describe('labelUtils', () => {
  describe('compareLabelsAlphanumeric', () => {
    it('should sort purely alphabetical labels case-insensitively', () => {
      const input = ['Charlie', 'alice', 'Bob'];
      const expected = ['alice', 'Bob', 'Charlie'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should sort numeric labels by numeric value', () => {
      const input = ['10', '2', '1', '100'];
      const expected = ['1', '2', '10', '100'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should sort alphanumeric labels with numbers correctly', () => {
      const input = ['Team 10', 'Team 2', 'Team 1', 'Team 20'];
      const expected = ['Team 1', 'Team 2', 'Team 10', 'Team 20'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should handle labels with leading zeros', () => {
      const input = ['A10', 'A02', 'A1', 'A001'];
      const result = input.sort(compareLabelsAlphanumeric);
      
      // A1 and A001 are numerically equal (both = 1), so they can be in any order
      // A02 = 2, A10 = 10, so the sorted order should have the "1" values first, then 2, then 10
      expect(result[0]).toMatch(/^A(1|001)$/); // First should be A1 or A001
      expect(result[1]).toMatch(/^A(1|001)$/); // Second should be A1 or A001 (whichever wasn't first)
      expect(result[2]).toBe('A02');
      expect(result[3]).toBe('A10');
    });

    it('should handle mixed alphanumeric patterns', () => {
      const input = ['Room1B2', 'Room1B10', 'Room1A1', 'Room2A1'];
      const expected = ['Room1A1', 'Room1B2', 'Room1B10', 'Room2A1'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should handle labels with multiple numeric parts', () => {
      const input = ['v1.10.2', 'v1.2.3', 'v1.10.1', 'v2.1.1'];
      const expected = ['v1.2.3', 'v1.10.1', 'v1.10.2', 'v2.1.1'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should handle empty and whitespace strings', () => {
      const input = ['', 'A', ' ', 'B'];
      const expected = ['', ' ', 'A', 'B'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should handle identical labels', () => {
      const input = ['Team 1', 'Team 1', 'Team 2'];
      const expected = ['Team 1', 'Team 1', 'Team 2'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });

    it('should sort jury labels with numbers correctly', () => {
      const input = ['Jury 10', 'Jury 1', 'Jury 2', 'Jury 100'];
      const expected = ['Jury 1', 'Jury 2', 'Jury 10', 'Jury 100'];
      expect(input.sort(compareLabelsAlphanumeric)).toEqual(expected);
    });
  });

  describe('generateDuplicateLabel', () => {
    it('should increment trailing numbers', () => {
      expect(generateDuplicateLabel('DAY02')).toBe('DAY03');
      expect(generateDuplicateLabel('OP1')).toBe('OP2');
      expect(generateDuplicateLabel('Session 9')).toBe('Session 10');
    });

    it('should preserve leading zeros when appropriate', () => {
      expect(generateDuplicateLabel('A09')).toBe('A10');
      expect(generateDuplicateLabel('Test 001')).toBe('Test 002');
    });

    it('should append (copy) when no trailing number', () => {
      expect(generateDuplicateLabel('Test')).toBe('Test (copy)');
      expect(generateDuplicateLabel('Session ABC')).toBe('Session ABC (copy)');
    });

    it('should handle number overflow correctly', () => {
      expect(generateDuplicateLabel('A99')).toBe('A100');
      expect(generateDuplicateLabel('Test 999')).toBe('Test 1000');
    });
  });
});
