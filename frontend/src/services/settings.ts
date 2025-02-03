import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface SystemSettings {
  batchProcessing: {
    rate: number;
    maxRetries: number;
    retryDelay: number;
    maxSize: number;
  };
  performance: {
    slaWarningThreshold: number;
    slaCriticalThreshold: number;
    sampleRate: number;
  };
  featureFlags: {
    newBatchSystem: boolean;
    analyticsDashboard: boolean;
    performanceMonitoring: boolean;
  };
  cache: {
    previewSize: number;
    previewTtl: number;
  };
}

interface NotificationPreferences {
  user_id: string;
  email: boolean;
  slack: boolean;
  push_notifications: boolean;
  thresholds: {
    success_rate: number;
    error_rate: number;
    credits_used: number;
  };
}

export function useSystemSettings() {
  const [data, setData] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settings, error: fetchError } = await supabase
          .from('sms_system_settings')
          .select('*')
          .single();

        if (fetchError) throw fetchError;

        setData(settings);
        setError(null);
      } catch (err) {
        console.error('Error fetching system settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch system settings');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const { error: updateError } = await supabase
        .from('sms_system_settings')
        .update(newSettings)
        .eq('id', 1);

      if (updateError) throw updateError;

      setData(prev => prev ? { ...prev, ...newSettings } : null);
      return true;
    } catch (err) {
      console.error('Error updating system settings:', err);
      return false;
    }
  };

  return {
    data,
    loading,
    error,
    updateSettings,
  };
}

// Helper function to get settings without hooks
export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const { data, error } = await supabase
      .from('sms_system_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error getting system settings:', err);
    return null;
  }
}

// Notification preferences functions
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('sms_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error getting notification preferences:', err);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sms_notification_preferences')
      .update(preferences)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    return false;
  }
}

// Admin settings functions
export async function getAdminEmails(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('sms_system_settings')
      .select('admin_emails')
      .single();

    if (error) throw error;
    return data?.admin_emails || [];
  } catch (err) {
    console.error('Error getting admin emails:', err);
    return [];
  }
}

export async function getSlackWebhooks(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('sms_slack_webhooks')
      .select('webhook_url');

    if (error) throw error;
    return data?.map(d => d.webhook_url) || [];
  } catch (err) {
    console.error('Error getting Slack webhooks:', err);
    return [];
  }
}
