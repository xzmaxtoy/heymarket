import { createClient } from '@supabase/supabase-js';
import config from '../config/config.js';
import { getEasternDayBounds, toEasternTime } from './dateUtils.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Apply a filter to a Supabase query based on operator type
 * @param {Object} query - Supabase query
 * @param {Object} filter - Filter criteria
 * @returns {Object} Modified query
 */

function applyFilter(query, filter) {
  const { column, operator, value, value2 } = filter;
  const isDateField = ['date_active', 'date_create', 'birthday'].includes(column);

  // Handle null checks first
  if (operator === 'is_null') {
    return query.is(column, null);
  }
  if (operator === 'is_not_null') {
    return query.not(column, 'is', null);
  }

  // For date fields, use Eastern Time comparison
  if (isDateField) {
    const datePart = value.split('T')[0];
    const datePart2 = value2 ? value2.split('T')[0] : null;

    switch (operator) {
      case 'equals': {
        const { start, end } = getEasternDayBounds(datePart);
        return query.gte(column, start).lt(column, end);
      }
      case 'greater_than': {
        const { end } = getEasternDayBounds(datePart);
        return query.gte(column, end);
      }
      case 'less_than': {
        const { start } = getEasternDayBounds(datePart);
        return query.lt(column, start);
      }
      case 'between': {
        const { start } = getEasternDayBounds(datePart);
        const { end } = getEasternDayBounds(datePart2);
        return query.gte(column, start).lt(column, end);
      }
      default:
        return query;
    }
  }

  // For non-date fields, use normal comparison
  switch (operator) {
    case 'equals':
      return query.eq(column, value);
    case 'contains':
      return query.ilike(column, `%${value}%`);
    case 'not_contains':
      return query.not(column, 'ilike', `%${value}%`);
    case 'starts_with':
      return query.ilike(column, `${value}%`);
    case 'ends_with':
      return query.ilike(column, `%${value}`);
    case 'greater_than':
      return query.gt(column, value);
    case 'less_than':
      return query.lt(column, value);
    case 'between':
      return query.gte(column, value).lte(column, value2);
    case 'in_list':
      const values = value.split('\n').map(v => v.trim()).filter(v => v);
      return query.in(column, values);
    default:
      return query;
  }
}

/**
 * Get customers with advanced filters
 * @param {Array} filters - Array of filter objects
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of records per page
 * @returns {Promise<{data: Array, count: number}>} Customers and total count
 */
export async function getCustomers(filters = [], page = 1, pageSize = 50) {
  try {
    let query = supabase
      .from('customer')
      .select('*', { count: 'exact' });

    // Apply all filters
    filters.forEach(filter => {
      query = applyFilter(query, filter);
    });

    // Add pagination
    const start = (page - 1) * pageSize;
    query = query
      .range(start, start + pageSize - 1)
      .order('date_active', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    return {
      data: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Customer fetch error:', error);
    throw error;
  }
}

/**
 * Get unique cities for filtering
 * @returns {Promise<Array<string>>} List of unique cities
 */
export async function getUniqueCities() {
  try {
    const { data, error } = await supabase
      .from('customer')
      .select('city')
      .not('city', 'is', null)
      .order('city');

    if (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }

    // Get unique cities
    const cities = [...new Set(data.map(row => row.city))];
    return cities;
  } catch (error) {
    console.error('Cities fetch error:', error);
    throw error;
  }
}

/**
 * Format phone number for Heymarket API
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if needed
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
    cleaned = '1' + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Validate customer data for messaging
 * @param {Object} customer - Customer data
 * @returns {Object} Validation result
 */
export function validateCustomerForMessaging(customer) {
  const errors = [];
  
  if (!customer.phone) {
    errors.push('Missing phone number');
  } else {
    const formattedPhone = formatPhoneNumber(customer.phone);
    if (!formattedPhone || formattedPhone.length !== 11) {
      errors.push('Invalid phone number format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
