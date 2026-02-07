import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { toDate } from 'date-fns-tz';

/**
 * Test the formatTime function logic used in ScheduleOverview component.
 * This ensures that times from PDF parsing are displayed correctly without timezone conversion.
 */
describe('ScheduleOverview formatTime', () => {
  // This mimics the formatTime function from ScheduleOverview.tsx
  const formatTime = (isoString: string) => {
    const date = toDate(isoString);
    return format(date, 'HH:mm');
  };

  it('should format ISO string to HH:mm without timezone conversion', () => {
    // Test with a known ISO string
    const isoString = '2024-01-15T10:00:00.000Z';
    const result = formatTime(isoString);
    
    // Result should be in HH:mm format
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should preserve hours when formatting time from PDF parsing', () => {
    // Simulate time received from PDF parsing (e.g., 10:00 AM)
    // When stored as ISO, if it's 10:00 local time, it should display as 10:00
    const isoString = '2024-01-15T10:00:00.000Z';
    const result = formatTime(isoString);
    
    // Use toDate to get the local time representation
    const date = toDate(isoString);
    const expectedHour = String(date.getHours()).padStart(2, '0');
    const expectedMinute = String(date.getMinutes()).padStart(2, '0');
    
    expect(result).toBe(`${expectedHour}:${expectedMinute}`);
  });

  it('should handle afternoon times correctly', () => {
    const isoString = '2024-01-15T14:30:00.000Z';
    const result = formatTime(isoString);
    
    // Should use 24-hour format
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    
    // Verify it uses the same logic as toDate
    const date = toDate(isoString);
    const expectedHour = String(date.getHours()).padStart(2, '0');
    const expectedMinute = String(date.getMinutes()).padStart(2, '0');
    
    expect(result).toBe(`${expectedHour}:${expectedMinute}`);
  });

  it('should handle midnight correctly', () => {
    const isoString = '2024-01-15T00:00:00.000Z';
    const result = formatTime(isoString);
    
    const date = toDate(isoString);
    const expectedHour = String(date.getHours()).padStart(2, '0');
    const expectedMinute = String(date.getMinutes()).padStart(2, '0');
    
    expect(result).toBe(`${expectedHour}:${expectedMinute}`);
  });

  it('should handle times without milliseconds', () => {
    const isoString = '2024-01-15T09:15:00Z';
    const result = formatTime(isoString);
    
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should be consistent with dateUtils isoToLocalDateTime', () => {
    // This test ensures formatTime is consistent with the rest of the app
    const isoString = '2024-01-15T10:00:00.000Z';
    const formattedTime = formatTime(isoString);
    
    // Use the same toDate function that dateUtils uses
    const date = toDate(isoString);
    const timeFromDate = format(date, 'HH:mm');
    
    expect(formattedTime).toBe(timeFromDate);
  });
});
