import { format, parse } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

/**
 * Converts a datetime-local input value (YYYY-MM-DDTHH:mm) to an ISO string
 * while preserving the local time in the user's timezone.
 * 
 * For example, if the user picks "2024-01-15T10:00" in their local timezone,
 * this will create an ISO string that represents 10:00 in that timezone.
 * 
 * @param localDateTimeString - The datetime-local input value (YYYY-MM-DDTHH:mm format)
 * @returns ISO string with timezone preserved, or empty string if value is falsy
 */
export const localDateTimeToISO = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  // Parse the datetime-local string as a local date
  // The input format is YYYY-MM-DDTHH:mm (e.g., "2024-01-15T10:00")
  const parsedDate = parse(localDateTimeString, "yyyy-MM-dd'T'HH:mm", new Date());
  
  // Check if the date is valid
  if (isNaN(parsedDate.getTime())) {
    return '';
  }
  
  // Convert to ISO string - this will use the local timezone
  return parsedDate.toISOString();
};

/**
 * Converts an ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
 * displaying it in the user's local timezone.
 * 
 * For example, if the backend sends "2024-01-15T10:00:00.000Z" (UTC),
 * and the user is in EST (UTC-5), this will display "2024-01-15T05:00".
 * 
 * @param isoString - The ISO string to convert
 * @returns Datetime-local format (YYYY-MM-DDTHH:mm) in local timezone, or empty string
 */
export const isoToLocalDateTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = toDate(isoString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as YYYY-MM-DDTHH:mm in local timezone
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
};

/**
 * Formats a date string or Date object to European format (dd/MM/yyyy HH:mm)
 * displaying it in the user's local timezone.
 * 
 * @param date - The date string or Date object to format
 * @returns Formatted date string in European format (dd/MM/yyyy HH:mm) using 24h format, or empty string if invalid
 */
export const formatEuropeanDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? toDate(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Format in local timezone
    return format(dateObj, 'dd/MM/yyyy HH:mm');
  } catch {
    return '';
  }
};

// Legacy functions - kept for backwards compatibility but deprecated
/**
 * @deprecated Use localDateTimeToISO instead for proper timezone handling
 */
export const toISOString = (value: string): string => {
  return localDateTimeToISO(value);
};

/**
 * @deprecated Use isoToLocalDateTime instead for proper timezone handling
 */
export const fromISOString = (isoString: string): string => {
  return isoToLocalDateTime(isoString);
};
