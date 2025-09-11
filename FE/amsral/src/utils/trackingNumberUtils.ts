/**
 * Utility functions for generating and managing tracking numbers
 * Format: <order_id><alphabetical_letter> (e.g., 6A, 6B, 6C, etc.)
 */

/**
 * Generates the next tracking number for a given order ID based on existing records
 * @param orderId - The order ID
 * @param existingRecords - Array of existing order records for this order
 * @returns The next tracking number (e.g., "6A", "6B", "6C")
 */
export function generateNextTrackingNumber(
  orderId: number, 
  existingRecords: Array<{ trackingNumber?: string }>
): string {
  // Extract existing tracking numbers for this order
  const existingTrackingNumbers = existingRecords
    .map(record => record.trackingNumber)
    .filter(trackingNumber => trackingNumber && trackingNumber.startsWith(orderId.toString()))
    .map(trackingNumber => trackingNumber!.substring(orderId.toString().length))
    .filter(suffix => suffix.length === 1 && /^[A-Z]$/.test(suffix));

  // Find the next available letter
  const usedLetters = new Set(existingTrackingNumbers);
  let nextLetter = 'A';
  
  // Find the first unused letter
  while (usedLetters.has(nextLetter)) {
    nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    
    // If we reach beyond Z, we could extend to AA, AB, etc. if needed
    // For now, we'll limit to single letters (A-Z)
    if (nextLetter > 'Z') {
      throw new Error(`Maximum tracking numbers reached for order ${orderId}. Cannot generate more than 26 records per order.`);
    }
  }

  return `${orderId}${nextLetter}`;
}

/**
 * Validates if a tracking number follows the correct format
 * @param trackingNumber - The tracking number to validate
 * @returns true if valid, false otherwise
 */
export function isValidTrackingNumber(trackingNumber: string): boolean {
  // Format: <order_id><single_letter>
  const pattern = /^\d+[A-Z]$/;
  return pattern.test(trackingNumber);
}

/**
 * Extracts the order ID from a tracking number
 * @param trackingNumber - The tracking number (e.g., "6A")
 * @returns The order ID (e.g., 6)
 */
export function extractOrderIdFromTrackingNumber(trackingNumber: string): number {
  if (!isValidTrackingNumber(trackingNumber)) {
    throw new Error(`Invalid tracking number format: ${trackingNumber}`);
  }
  
  const orderId = trackingNumber.slice(0, -1);
  return parseInt(orderId, 10);
}

/**
 * Extracts the letter suffix from a tracking number
 * @param trackingNumber - The tracking number (e.g., "6A")
 * @returns The letter suffix (e.g., "A")
 */
export function extractLetterFromTrackingNumber(trackingNumber: string): string {
  if (!isValidTrackingNumber(trackingNumber)) {
    throw new Error(`Invalid tracking number format: ${trackingNumber}`);
  }
  
  return trackingNumber.slice(-1);
}

/**
 * Gets all tracking numbers for a specific order
 * @param orderId - The order ID
 * @param allRecords - Array of all order records
 * @returns Array of tracking numbers for the specified order
 */
export function getTrackingNumbersForOrder(
  orderId: number, 
  allRecords: Array<{ trackingNumber?: string }>
): string[] {
  return allRecords
    .map(record => record.trackingNumber)
    .filter(trackingNumber => trackingNumber && trackingNumber.startsWith(orderId.toString()))
    .map(trackingNumber => trackingNumber!) as string[];
}

/**
 * Checks if a tracking number is already in use
 * @param trackingNumber - The tracking number to check
 * @param existingRecords - Array of existing order records
 * @returns true if already in use, false otherwise
 */
export function isTrackingNumberInUse(
  trackingNumber: string, 
  existingRecords: Array<{ trackingNumber?: string }>
): boolean {
  return existingRecords.some(record => record.trackingNumber === trackingNumber);
}
