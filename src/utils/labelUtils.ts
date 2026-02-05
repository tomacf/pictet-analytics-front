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
