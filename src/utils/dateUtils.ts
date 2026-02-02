/**
 * Converts a datetime-local input value to ISO string format
 * @param value - The datetime-local input value (YYYY-MM-DDTHH:mm format)
 * @returns ISO string or empty string if value is falsy
 */
export const toISOString = (value: string): string => {
  return value ? new Date(value).toISOString() : '';
};

/**
 * Converts an ISO string to datetime-local input format
 * @param isoString - The ISO string to convert
 * @returns Datetime-local format (YYYY-MM-DDTHH:mm) or empty string
 */
export const fromISOString = (isoString: string): string => {
  return isoString ? isoString.slice(0, 16) : '';
};
