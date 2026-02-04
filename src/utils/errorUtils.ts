/**
 * Utility functions for error handling
 */

/**
 * Extracts and formats a 409 Conflict error message from an API error
 * @param err - The error object from the API
 * @param defaultMessage - Default message to use if details cannot be extracted
 * @returns Formatted error message
 */
export const format409Error = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'status' in err && err.status === 409) {
    const errorBody = 'body' in err ? err.body : null;
    let errorMessage = 'Conflict detected: ';
    
    if (errorBody && typeof errorBody === 'object' && 'detail' in errorBody) {
      errorMessage += String(errorBody.detail);
    } else {
      errorMessage += defaultMessage;
    }
    
    return errorMessage;
  }
  
  // Not a 409 error, return generic message
  return err instanceof Error ? err.message : defaultMessage;
};

/**
 * Checks if an error is a 409 Conflict error
 * @param err - The error object to check
 * @returns True if the error is a 409 Conflict error
 */
export const is409Error = (err: unknown): boolean => {
  return err !== null && typeof err === 'object' && 'status' in err && err.status === 409;
};
