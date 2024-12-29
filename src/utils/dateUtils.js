/**
 * Convert YYYY-MM-DD date string to Go time format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Date in Go time format (e.g., "2024-12-26T00:00:00Z")
 */
export function toGoTimeFormat(dateStr) {
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Convert date to YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export function toYYYYMMDD(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a string is in YYYY-MM-DD format
 * @param {string} dateStr - Date string to check
 * @returns {boolean} True if valid YYYY-MM-DD format
 */
export function isValidYYYYMMDD(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
