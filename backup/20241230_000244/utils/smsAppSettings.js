import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Get default settings for a key
 * @param {string} key - Setting key
 * @returns {any} Default setting value
 */
function getDefaultSettings(key) {
  switch (key) {
    case 'customer_columns':
      return {
        name: true,
        phone: true,
        email: true,
        city: true,
        date_active: true,
        credit: false,
        point: false,
        date_create: false,
        fashion_percentage: false,
        shaper_percentage: false,
        bra_percentage: false,
        other_percentage: false,
        birthday: false,
        address: false,
        postcode: false,
        remarks: false,
        ref_cus_id: false,
        staff_id: false,
        card_store_id: false,
        store_active: false,
        cus_id: false,
        code: false,
        option1: false,
        option2: false,
        option3: false
      };
    default:
      return null;
  }
}

/**
 * Get a setting value by key
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key) {
  try {
    const { data, error } = await supabase
      .from('sms_app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        // Table doesn't exist or no data found, return default settings
        const defaultValue = getDefaultSettings(key);
        if (defaultValue) {
          // Try to save default settings
          await saveSetting(key, defaultValue).catch(console.error);
        }
        return defaultValue;
      }
      console.error('Error fetching setting:', error);
      return getDefaultSettings(key);
    }

    return data?.value || getDefaultSettings(key);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return getDefaultSettings(key);
  }
}

/**
 * Save a setting value
 * @param {string} key - Setting key
 * @param {any} value - Setting value (will be stored as JSONB)
 * @returns {Promise<boolean>} Success status
 */
export async function saveSetting(key, value) {
  try {
    // First check if the record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('sms_app_settings')
      .select('*')
      .eq('key', key);

    console.log('Existing data:', existingData);
    console.log('Fetch error:', fetchError);

    // Convert value to proper JSON
    const formattedValue = {};
    Object.entries(value).forEach(([k, v]) => {
      formattedValue[k] = Boolean(v);
    });

    // If record exists, update it
    if (existingData && existingData.length > 0) {
      const { error: updateError } = await supabase
        .from('sms_app_settings')
        .update({
          value: formattedValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (updateError) {
        console.error('Error updating setting:', updateError);
        return false;
      }
    } else {
      // If record doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('sms_app_settings')
        .insert({
          key,
          value: formattedValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting setting:', insertError);
        return false;
      }
    }

    console.log('Setting saved successfully');
    return true;
  } catch (error) {
    console.error('Settings save error:', error);
    return false;
  }
}

/**
 * Delete a setting
 * @param {string} key - Setting key
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSetting(key) {
  try {
    const { error } = await supabase
      .from('sms_app_settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Error deleting setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Settings delete error:', error);
    return false;
  }
}
