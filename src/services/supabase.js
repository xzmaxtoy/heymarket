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
async function updateBatchStatus(batchId, updates) {
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
async function updateBatchLogs(batchId, status, error = null) {
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
async function createBatchErrorLog(batchId, errorDetails) {
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
async function completeBatch(batchId, finalState) {
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

/**
 * Create initial batch record
 * @param {object} batchData - Batch creation data
 * @returns {Promise<object>} Created batch record
 */
async function createBatchRecord(batchData) {
  const { data, error } = await supabase
    .from('sms_batches')
    .insert({
      name: batchData.name,
      template_id: batchData.template?.id,
      status: 'pending',
      total_recipients: batchData.recipients.length,
      completed_count: 0,
      failed_count: 0,
      scheduled_for: batchData.options?.scheduleTime,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create batch record');
  
  return data;
}

/**
 * Create batch log entries for each recipient
 * @param {string} batchId - Batch ID
 * @param {object} batchData - Batch creation data
 * @returns {Promise<void>}
 */
async function createBatchLogs(batchId, batchData) {
  const batchLogs = batchData.recipients.map(recipient => ({
    batch_id: batchId,
    targets: recipient.phoneNumber,
    message: batchData.template?.text || '',
    variables: recipient.variables,
    status: 'pending',
    date_utc: new Date().toISOString(),
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('sms_batch_log')
    .insert(batchLogs);

  if (error) throw error;
}

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<object>} Template record
 */
async function getTemplateById(templateId) {
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    throw error;
  }

  return data;
}

/**
 * Create or update template
 * @param {object} template - Template data
 * @returns {Promise<object>} Template record
 */
async function upsertTemplate(template) {
  const { data, error } = await supabase
    .from('sms_templates')
    .upsert({
      ...template,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting template:', error);
    throw error;
  }

  return data;
}

/**
 * Delete template
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
async function deleteTemplate(templateId) {
  const { error } = await supabase
    .from('sms_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Export all functions and supabase client
export {
  supabase,
  updateBatchStatus,
  updateBatchLogs,
  createBatchErrorLog,
  completeBatch,
  createBatchRecord,
  createBatchLogs,
  getTemplateById,
  upsertTemplate,
  deleteTemplate
};
