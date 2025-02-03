import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_SETTINGS = {
  batchProcessing: {
    rate: Number(process.env.BATCH_PROCESSING_RATE) || 5,
    maxRetries: Number(process.env.BATCH_MAX_RETRIES) || 3,
    retryDelay: Number(process.env.BATCH_RETRY_DELAY) || 300000,
    maxSize: Number(process.env.BATCH_MAX_SIZE) || 10000,
  },
  performance: {
    slaWarningThreshold: Number(process.env.SLA_WARNING_THRESHOLD) || 900000,
    slaCriticalThreshold: Number(process.env.SLA_CRITICAL_THRESHOLD) || 1800000,
    sampleRate: Number(process.env.PERFORMANCE_SAMPLE_RATE) || 100,
  },
  featureFlags: {
    newBatchSystem: process.env.FEATURE_FLAG_NEW_BATCH_SYSTEM === 'true',
    analyticsDashboard: process.env.FEATURE_FLAG_ANALYTICS_DASHBOARD === 'true',
    performanceMonitoring: process.env.FEATURE_FLAG_PERFORMANCE_MONITORING === 'true',
  },
  cache: {
    previewSize: Number(process.env.PREVIEW_CACHE_SIZE) || 1000,
    previewTtl: Number(process.env.PREVIEW_CACHE_TTL) || 3600,
  },
};

async function initializeSettings() {
  try {
    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from('sms_system_settings')
      .select('*')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingSettings) {
      // Insert default settings
      const { error: insertError } = await supabase
        .from('sms_system_settings')
        .insert([{ id: 1, ...DEFAULT_SETTINGS }]);

      if (insertError) throw insertError;

      console.log('Successfully initialized system settings');
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('sms_system_settings')
        .update(DEFAULT_SETTINGS)
        .eq('id', 1);

      if (updateError) throw updateError;

      console.log('Successfully updated system settings');
    }

    // Initialize notification preferences table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    // Create default preferences for each user
    for (const user of users) {
      const { data: existingPrefs, error: prefsError } = await supabase
        .from('sms_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        throw prefsError;
      }

      if (!existingPrefs) {
        const defaultPreferences = {
          user_id: user.id,
          email: true,
          slack: false,
          push_notifications: true,
          thresholds: {
            success_rate: 95,
            error_rate: 5,
            credits_used: 1000,
          },
        };

        const { error: insertPrefsError } = await supabase
          .from('sms_notification_preferences')
          .insert([defaultPreferences]);

        if (insertPrefsError) throw insertPrefsError;

        console.log(`Initialized preferences for user ${user.id}`);
      }
    }

    console.log('Settings initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing settings:', error);
    process.exit(1);
  }
}

initializeSettings();
