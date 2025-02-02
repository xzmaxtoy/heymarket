import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lsccbztinaoebduhrgyy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzY2NienRpbmFvZWJkdWhyZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTYzNzMsImV4cCI6MjA1MDQ3MjM3M30.-d5rOLndmrAqafHSYInXAosbK_EQk3AUuvHGLMr1mTg'
);

const defaultSettings = {
  customer_columns: {
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
  }
};

async function initSettings() {
  try {
    // Upsert default settings
    const { error } = await supabase
      .from('sms_app_settings')
      .upsert({
        key: 'customer_columns',
        value: JSON.stringify(defaultSettings.customer_columns),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('Error initializing settings:', error);
      process.exit(1);
    }

    console.log('Settings initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initSettings();
