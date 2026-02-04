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

/**
 * Formats a date string or Date object to European format (dd/MM/yyyy HH:mm)
 * @param date - The date string or Date object to format
 * @returns Formatted date string in European format (dd/MM/yyyy HH:mm) using 24h format
 */
export const formatEuropeanDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
