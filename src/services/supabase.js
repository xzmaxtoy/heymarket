import { createClient } from '@supabase/supabase-js';
import config from '../config/config.js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

/**
 * Update batch status and progress in Supabase
 * @param {string} batchId - Batch ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated batch record
 */
export async function updateBatchStatus(batchId, updates) {
  const { data, error } = await supabase
    .from('sms_batches')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update batch log entries
 * @param {string} batchId - Batch ID
 * @param {string} status - New status
 * @param {string} [error] - Optional error message
 * @returns {Promise<void>}
 */
export async function updateBatchLogs(batchId, status, error = null) {
  const { error: updateError } = await supabase
    .from('sms_batch_log')
    .update({
      status,
      error,
      updated_at: new Date().toISOString()
    })
    .eq('batch_id', batchId);

  if (updateError) throw updateError;
}

/**
 * Create batch error log
 * @param {string} batchId - Batch ID
 * @param {object} errorDetails - Error details
 * @returns {Promise<void>}
 */
export async function createBatchErrorLog(batchId, errorDetails) {
  const { error } = await supabase
    .from('sms_batch_log')
    .insert({
      batch_id: batchId,
      status: 'error',
      error: JSON.stringify(errorDetails),
      date_utc: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

  if (error) throw error;
}

/**
 * Complete batch processing
 * @param {string} batchId - Batch ID
 * @param {object} finalState - Final batch state
 * @returns {Promise<object>} Updated batch record
 */
export async function completeBatch(batchId, finalState) {
  const { data, error } = await supabase
    .from('sms_batches')
    .update({
      status: finalState.status,
      completed_count: finalState.progress.completed,
      failed_count: finalState.progress.failed,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default {
  supabase,
  updateBatchStatus,
  updateBatchLogs,
  createBatchErrorLog,
  completeBatch
};
