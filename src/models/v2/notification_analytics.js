import { supabase } from '../../services/supabase.js';

/**
 * Get notification metrics
 */
export async function getMetrics() {
  const { data, error } = await supabase
    .from('sms_notification_metrics')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get channel distribution
 */
export async function getChannelDistribution() {
  const { data, error } = await supabase
    .from('sms_notification_channels')
    .select('*')
    .order('count', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get daily volume
 */
export async function getDailyVolume(startDate) {
  const { data, error } = await supabase
    .from('sms_notification_volume')
    .select('*')
    .gte('date', startDate.toISOString())
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get notification trends
 */
export async function getTrends(daysBack) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('sms_notification_trends')
    .select('*')
    .gte('date', startDate.toISOString())
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Setup analytics functions
 */
export async function setupAnalytics() {
  const { error } = await supabase.rpc('setup_notification_analytics');
  if (error) throw error;
}
