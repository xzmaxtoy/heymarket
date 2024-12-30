/**
 * Convert a date string to Eastern Time timestamp
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} time - Optional time string (HH:mm:ss)
 * @returns {string} ISO timestamp in Eastern Time
 */
export function toEasternTime(dateStr, time = '00:00:00') {
  // Create a date object with the date and time in Eastern Time
  const date = new Date(`${dateStr}T${time}-04:00`);
  return date.toISOString();
}

/**
 * Get start and end of day in Eastern Time
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Object} Object with start and end timestamps
 */
export function getEasternDayBounds(dateStr) {
  // For start of day in Eastern Time
  const startDate = new Date(`${dateStr}T00:00:00-04:00`);
  
  // For end of day in Eastern Time
  const endDate = new Date(`${dateStr}T23:59:59.999-04:00`);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}
