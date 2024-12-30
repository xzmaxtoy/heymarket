import { createClient } from '@supabase/supabase-js';
import config from '../config/config.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Get cached phone stats for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array|null>} Array of {phone_number, message_count} objects or null if not found
 */
export async function getCachedDate(date) {
  try {
    const { data, error } = await supabase
      .from('phone_stats')
      .select('phone_number, message_count')
      .eq('date', date);

    if (error) {
      console.error('Supabase cache read error:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Get cached phone stats for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object[]>} Array of {phone_number, message_count, date} objects
 */
export async function getCachedRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('phone_stats')
      .select('phone_number, message_count, date')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Supabase cache range read error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Cache range read error:', error);
    return [];
  }
}

/**
 * Store phone stats in cache for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} messages - Array of message objects from Heymarket API
 */
export async function setCachedDate(date, messages) {
  try {
    // Count messages per phone number
    const phoneStats = new Map();
    messages.forEach(msg => {
      const phone = msg.target || msg.contact?.phone_number || msg.to || msg.from;
      if (!phone) return;

      // Clean phone number format
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('1')) {
        cleanPhone = '1' + cleanPhone.substring(1);
      } else if (cleanPhone.length > 11) {
        cleanPhone = '1' + cleanPhone.slice(-10);
      }

      const count = phoneStats.get(cleanPhone) || 0;
      phoneStats.set(cleanPhone, count + 1);
    });

    // Convert to array of records
    const records = Array.from(phoneStats.entries()).map(([phone_number, message_count]) => ({
      phone_number,
      message_count,
      date,
      created_at: new Date().toISOString()
    }));

    // Delete existing records for this date
    await supabase
      .from('phone_stats')
      .delete()
      .eq('date', date);

    // Insert new records
    if (records.length > 0) {
      const { error } = await supabase
        .from('phone_stats')
        .insert(records);

      if (error) {
        console.error('Supabase cache write error:', error);
      }
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Clear cache for a specific date range or all cache
 * @param {string} [startDate] - Optional start date in YYYY-MM-DD format
 * @param {string} [endDate] - Optional end date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function clearCache(startDate, endDate) {
  try {
    let query = supabase.from('phone_stats').delete();
    
    if (startDate && endDate) {
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }
    
    const { error } = await query;

    if (error) {
      console.error('Cache clear error:', error);
      return {
        success: false,
        message: `Failed to clear cache: ${error.message}`
      };
    }

    return {
      success: true,
      message: startDate && endDate 
        ? `Cache cleared for dates between ${startDate} and ${endDate}`
        : 'All cache cleared successfully'
    };
  } catch (error) {
    console.error('Cache clear error:', error);
    return {
      success: false,
      message: `Failed to clear cache: ${error.message}`
    };
  }
}

/**
 * Check if a date is in the past
 * @param {string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

/**
 * Get missing dates from a range that aren't cached
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<string[]>} Array of dates that need to be fetched
 */
export async function getMissingDates(startDate, endDate) {
  const cachedData = await getCachedRange(startDate, endDate);
  const cachedDates = new Set(cachedData.map(d => d.date));
  
  const missingDates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (!cachedDates.has(dateStr)) {
      missingDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return missingDates;
}
