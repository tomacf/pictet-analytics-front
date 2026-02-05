/**
 * Generates a new label for duplicating a session.
 * 
 * If the original label ends with a trailing integer, increments that integer by 1
 * while preserving leading zeros when appropriate (e.g., "DAY02" -> "DAY03", "A09" -> "A10").
 * If no trailing integer exists, appends " (copy)" to the label.
 * 
 * @param originalLabel The original session label
 * @returns The new label for the duplicated session
 * 
 * @example
 * generateDuplicateLabel("DAY02") // "DAY03"
 * generateDuplicateLabel("OP1") // "OP2"
 * generateDuplicateLabel("Session 9") // "Session 10"
 * generateDuplicateLabel("A09") // "A10"
 * generateDuplicateLabel("Test") // "Test (copy)"
 */
export const generateDuplicateLabel = (originalLabel: string): string => {
  // Match trailing digits: capture prefix and the digit sequence
  // Regex explanation: (.*?) captures everything before digits (non-greedy), (\d+) captures the digits, \s*$ allows trailing whitespace
  const match = originalLabel.match(/(.*?)(\d+)\s*$/);
  
  if (match) {
    const prefix = match[1]; // Everything before the number
    const numStr = match[2]; // The numeric part as a string
    const num = parseInt(numStr, 10); // Convert to number
    const newNum = num + 1; // Increment
    
    // Preserve leading zeros if the incremented number has the same number of digits
    // Example: "09" -> "10" (both 2 digits, so format as "10")
    // Example: "02" -> "03" (both 2 digits, so format as "03")
    const originalLength = numStr.length;
    const newNumStr = newNum.toString();
    
    // Only pad with leading zeros if the new number has the same or fewer digits than the original
    if (newNumStr.length <= originalLength) {
      return prefix + newNumStr.padStart(originalLength, '0');
    } else {
      // If new number has more digits (e.g., 99 -> 100), just use the new number without padding
      return prefix + newNumStr;
    }
  }
  
  // No trailing digits found, fallback to appending " (copy)"
  return `${originalLabel} (copy)`;
};

/**
 * Compares two labels for alphanumeric sorting.
 * 
 * This function implements a natural sort order where:
 * - Alphabetical parts are compared case-insensitively
 * - Numerical parts are compared numerically (e.g., "Team 2" < "Team 10")
 * - Leading zeros are handled correctly
 * 
 * @param a First label to compare
 * @param b Second label to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 * 
 * @example
 * ["Team 10", "Team 2", "Team 1"].sort(compareLabelsAlphanumeric)
 * // Result: ["Team 1", "Team 2", "Team 10"]
 * 
 * ["A10", "A2", "A1"].sort(compareLabelsAlphanumeric)
 * // Result: ["A1", "A2", "A10"]
 */
export const compareLabelsAlphanumeric = (a: string, b: string): number => {
  // Split strings into parts of text and numbers
  const splitIntoChunks = (str: string): (string | number)[] => {
    const chunks: (string | number)[] = [];
    const regex = /(\d+|\D+)/g;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      const chunk = match[0];
      // If it's all digits, convert to number for numeric comparison
      if (/^\d+$/.test(chunk)) {
        chunks.push(parseInt(chunk, 10));
      } else {
        // Otherwise, keep as lowercase string for case-insensitive comparison
        chunks.push(chunk.toLowerCase());
      }
    }
    
    return chunks;
  };
  
  const aParts = splitIntoChunks(a);
  const bParts = splitIntoChunks(b);
  
  // Compare chunk by chunk
  const maxLength = Math.max(aParts.length, bParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    
    // If one string ran out of parts, it's "less than"
    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;
    
    // If types are different (number vs string), compare as strings
    if (typeof aPart !== typeof bPart) {
      const aStr = String(aPart);
      const bStr = String(bPart);
      if (aStr < bStr) return -1;
      if (aStr > bStr) return 1;
      continue;
    }
    
    // Both are same type, compare directly
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  // All parts are equal
  return 0;
};
