import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  localDateTimeToISO, 
  isoToLocalDateTime, 
  formatEuropeanDateTime,
  formatDateTimeInTimezone,
  formatDateTimeWithTimezone,
  formatTimeInTimezone
} from './dateUtils';

describe('dateUtils', () => {
  // Store original timezone
  let originalTZ: string | undefined;

  beforeEach(() => {
    originalTZ = process.env.TZ;
  });

  afterEach(() => {
    // Restore original timezone
    if (originalTZ) {
      process.env.TZ = originalTZ;
    } else {
      delete process.env.TZ;
    }
  });

  describe('localDateTimeToISO', () => {
    it('should convert local datetime string to ISO format', () => {
      const input = '2024-01-15T10:00';
      const result = localDateTimeToISO(input);
      
      // Should return a valid ISO string
      expect(result).toBeTruthy();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // The hour in the ISO string should reflect the timezone offset
      const date = new Date(result);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should handle empty string', () => {
      expect(localDateTimeToISO('')).toBe('');
    });

    it('should preserve local time when converting', () => {
      // When user picks 10:00 local time
      const input = '2024-01-15T10:00';
      const isoResult = localDateTimeToISO(input);
      
      // When we parse it back, we should get 10:00 in local time
      const date = new Date(isoResult);
      const localHours = date.getHours();
      const localMinutes = date.getMinutes();
      
      expect(localHours).toBe(10);
      expect(localMinutes).toBe(0);
    });
  });

  describe('isoToLocalDateTime', () => {
    it('should convert ISO string to local datetime format', () => {
      const isoInput = '2024-01-15T10:00:00.000Z';
      const result = isoToLocalDateTime(isoInput);
      
      // Should return format YYYY-MM-DDTHH:mm
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should handle empty string', () => {
      expect(isoToLocalDateTime('')).toBe('');
    });

    it('should handle invalid ISO string', () => {
      expect(isoToLocalDateTime('invalid')).toBe('');
    });

    it('should display time in local timezone', () => {
      // Create a known UTC time
      const isoInput = '2024-01-15T15:00:00.000Z'; // 3 PM UTC
      const result = isoToLocalDateTime(isoInput);
      
      // Parse the result to verify it's in local time
      const date = new Date(isoInput);
      const expectedHours = String(date.getHours()).padStart(2, '0');
      const expectedMinutes = String(date.getMinutes()).padStart(2, '0');
      
      expect(result).toContain(`${expectedHours}:${expectedMinutes}`);
    });
  });

  describe('formatEuropeanDateTime', () => {
    it('should format Date object to European format', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatEuropeanDateTime(date);
      
      // Should be in format dd/MM/yyyy HH:mm
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      expect(result).toContain('2024');
    });

    it('should format ISO string to European format', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = formatEuropeanDateTime(isoString);
      
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should handle empty string', () => {
      expect(formatEuropeanDateTime('')).toBe('');
    });

    it('should handle invalid date', () => {
      expect(formatEuropeanDateTime('invalid')).toBe('');
    });

    it('should use 24-hour format', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatEuropeanDateTime(date);
      
      // Should contain the hour in 24h format (not 2:30 PM)
      const parts = result.split(' ');
      expect(parts).toHaveLength(2);
      const time = parts[1];
      const hours = parseInt(time.split(':')[0]);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve time when converting local -> ISO -> local', () => {
      // User picks 10:00 AM local time
      const originalLocal = '2024-01-15T10:00';
      
      // Convert to ISO for backend
      const iso = localDateTimeToISO(originalLocal);
      expect(iso).toBeTruthy();
      
      // Convert back to local for display
      const backToLocal = isoToLocalDateTime(iso);
      
      // Should still be 10:00
      expect(backToLocal).toBe(originalLocal);
    });

    it('should preserve time for afternoon hours', () => {
      const originalLocal = '2024-01-15T15:30';
      const iso = localDateTimeToISO(originalLocal);
      const backToLocal = isoToLocalDateTime(iso);
      
      expect(backToLocal).toBe(originalLocal);
    });

    it('should preserve time for midnight', () => {
      const originalLocal = '2024-01-15T00:00';
      const iso = localDateTimeToISO(originalLocal);
      const backToLocal = isoToLocalDateTime(iso);
      
      expect(backToLocal).toBe(originalLocal);
    });

    it('should preserve time for end of day', () => {
      const originalLocal = '2024-01-15T23:59';
      const iso = localDateTimeToISO(originalLocal);
      const backToLocal = isoToLocalDateTime(iso);
      
      expect(backToLocal).toBe(originalLocal);
    });
  });

  describe('formatDateTimeInTimezone', () => {
    it('should format date in specified timezone', () => {
      // 10:00 UTC
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeInTimezone(isoString, 'UTC');
      
      expect(result).toBe('15/01/2024 10:00');
    });

    it('should format date in different timezone', () => {
      // 10:00 UTC should be 11:00 in CET (Europe/Zurich in winter)
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeInTimezone(isoString, 'Europe/Zurich');
      
      expect(result).toBe('15/01/2024 11:00');
    });

    it('should handle empty string', () => {
      expect(formatDateTimeInTimezone('', 'UTC')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatDateTimeInTimezone(null, 'UTC')).toBe('');
      expect(formatDateTimeInTimezone(undefined, 'UTC')).toBe('');
    });

    it('should fall back to local timezone when timezone is null', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeInTimezone(isoString, null);
      
      // Should return a valid formatted date
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should use custom format string', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeInTimezone(isoString, 'UTC', 'yyyy-MM-dd HH:mm:ss');
      
      expect(result).toBe('2024-01-15 10:00:00');
    });
  });

  describe('formatDateTimeWithTimezone', () => {
    it('should format date with timezone abbreviation', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeWithTimezone(isoString, 'UTC');
      
      expect(result).toBe('15/01/2024 10:00 (UTC)');
    });

    it('should format date with CET timezone abbreviation', () => {
      // 10:00 UTC should be 11:00 CET
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeWithTimezone(isoString, 'Europe/Zurich');
      
      // The timezone abbreviation may vary by system (CET vs GMT+1)
      expect(result).toMatch(/^15\/01\/2024 11:00 \((CET|GMT\+1)\)$/);
    });

    it('should handle empty string', () => {
      expect(formatDateTimeWithTimezone('', 'UTC')).toBe('');
    });

    it('should handle null timezone', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatDateTimeWithTimezone(isoString, null);
      
      // Should return a valid formatted date without timezone suffix
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });
  });

  describe('formatTimeInTimezone', () => {
    it('should format only time in specified timezone', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatTimeInTimezone(isoString, 'UTC');
      
      expect(result).toBe('10:00');
    });

    it('should format time in different timezone', () => {
      // 10:00 UTC should be 11:00 in CET
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = formatTimeInTimezone(isoString, 'Europe/Zurich');
      
      expect(result).toBe('11:00');
    });

    it('should handle empty string', () => {
      expect(formatTimeInTimezone('', 'UTC')).toBe('');
    });
  });
});
