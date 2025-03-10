import { supabase } from '../../services/supabase.js';
import { emitBatchUpdate, emitBatchError, emitBatchComplete } from '../../websocket/server.js';

class BatchManager {
  /**
   * Create a new batch
   */
  async createBatch(data) {
    try {
      const now = new Date().toISOString();
      const totalTime = data.customers.length * 200; // Average 5 messages per second
      const estimatedCompletion = new Date(Date.now() + totalTime).toISOString();

      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('sms_batches')
        .insert({
          name: data.name || `Batch ${now}`,
          template_id: data.template.id,
          status: 'pending',
          total_recipients: data.customers.length,
          completed_count: 0,
          failed_count: 0,
          pending_count: data.customers.length,
          processing_count: 0,
          scheduled_for: data.scheduledFor,
          timing: {
            created: now,
            estimated_completion: estimatedCompletion
          },
          progress: {
            total: data.customers.length,
            pending: data.customers.length,
            processing: 0,
            completed: 0,
            failed: 0
          },
          metrics: {
            messages_per_second: 0,
            success_rate: 0,
            credits_used: 0
          },
          errors: {
            categories: {},
            samples: []
          },
          created_by: data.userId,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch logs
      const { error: logsError } = await supabase
        .from('sms_batch_log')
        .insert(
          data.customers.map(customer => ({
            batch_id: batch.id,
            targets: customer.phone,
            variables: data.variables,
            message: data.template.text,
            status: 'pending',
            attempts: 0,
            created_at: now,
            updated_at: now,
            metadata: {
              priority: data.priority || 'normal',
              retryStrategy: {
                maxAttempts: 3,
                backoffMinutes: 5
              }
            }
          }))
        );

      if (logsError) throw logsError;

      return batch;
    } catch (error) {
      console.error('Batch creation error:', error);
      throw new Error(`Failed to create batch: ${error.message}`);
    }
  }

  /**
   * Update batch progress
   */
  async updateProgress(batchId, progress) {
    try {
      const { error } = await supabase
        .from('sms_batches')
        .update({
          pending_count: progress.pending || 0,
          processing_count: progress.processing || 0,
          completed_count: progress.completed || 0,
          failed_count: progress.failed || 0,
          progress: {
            total: progress.total || 0,
            pending: progress.pending || 0,
            processing: progress.processing || 0,
            completed: progress.completed || 0,
            failed: progress.failed || 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating batch progress:', error);
      throw new Error(`Failed to update batch progress: ${error.message}`);
    }
  }

  /**
   * Update batch metrics
   */
  async updateMetrics(batchId, metrics) {
    try {
      const { error } = await supabase
        .from('sms_batches')
        .update({
          metrics: {
            messages_per_second: metrics.messages_per_second || 0,
            success_rate: metrics.success_rate || 0,
            credits_used: metrics.credits_used || 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating batch metrics:', error);
      throw new Error(`Failed to update batch metrics: ${error.message}`);
    }
  }

  /**
   * Get batch by ID with related data
   */
  async getBatch(batchId) {
    try {
      // First get the batch
      const { data: batch, error: batchError } = await supabase
        .from('sms_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;
      if (!batch) throw new Error('Batch not found');

      // Get logs with pagination
      let allLogs = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        console.log(`Fetching batch logs page ${page} for batch ${batchId}`);
        const { data, error } = await supabase
          .from('sms_batch_log')
          .select('*')
          .eq('batch_id', batchId)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allLogs = allLogs.concat(data);
        console.log(`Retrieved ${data.length} logs, total so far: ${allLogs.length}`);
        
        if (data.length < pageSize) break;
        page++;
      }

      if (allLogs.length === 0) throw new Error('No messages found for batch');

      // Get first log to get template info
      const templateLog = allLogs[0];
      if (!templateLog) throw new Error('No messages found for batch');

      // Format response to match existing implementation
      return {
        id: batch.id,
        status: batch.status,
        progress: batch.progress || {
          total: batch.total_recipients,
          completed: batch.completed_count,
          failed: batch.failed_count,
          pending: batch.pending_count,
          processing: batch.processing_count
        },
        timing: batch.timing || {
          created: batch.created_at,
          started: batch.started_at,
          estimated_completion: batch.timing?.estimated_completion
        },
        errors: batch.errors || {
          categories: {},
          samples: []
        },
        metrics: batch.metrics || {
          messages_per_second: 0,
          success_rate: batch.completed_count ? (batch.completed_count / batch.total_recipients) * 100 : 0,
          credits_used: batch.completed_count
        },
        template: {
          id: batch.template_id,
          text: templateLog.message,
          variables: Object.keys(templateLog.variables || {})
        },
        results: allLogs.map(log => ({
          phoneNumber: log.targets,
          status: log.status,
          messageId: log.heymarket_message_id,
          error: log.error_message,
          errorCategory: log.error_category,
          timestamp: log.updated_at,
          attempts: log.attempts,
          variables: log.variables
        }))
      };
    } catch (error) {
      console.error('Error getting batch:', error);
      throw new Error(`Failed to get batch: ${error.message}`);
    }
  }

  /**
   * Update batch status
   */
  async updateStatus(batchId, status, metadata = {}) {
    try {
      const now = new Date().toISOString();
      const updates = {
        status,
        updated_at: now,
        ...metadata
      };

      // Add status-specific updates
      if (status === 'processing') {
        updates.started_at = now;
      } else if (status === 'completed') {
        updates.completed_at = now;
      }

      const { error } = await supabase
        .from('sms_batches')
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;

      // Emit websocket update
      const batch = await this.getBatch(batchId);
      if (status === 'completed') {
        emitBatchComplete(batchId, batch);
      } else {
        emitBatchUpdate(batchId, batch);
      }
    } catch (error) {
      console.error('Error updating batch status:', error);
      throw new Error(`Failed to update batch status: ${error.message}`);
    }
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, status, metadata = {}) {
    try {
      const now = new Date().toISOString();
      const { data: log } = await supabase
        .from('sms_batch_log')
        .select('batch_id, attempts, targets')
        .eq('id', messageId)
        .single();

      if (!log) throw new Error('Message log not found');

      const updates = {
        status,
        updated_at: now,
        attempts: (log.attempts || 0) + 1,
        heymarket_message_id: metadata.messageId,
        error_message: metadata.error,
        error_category: metadata.errorCategory
      };

      // Update message status
      const { error } = await supabase
        .from('sms_batch_log')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;

      // Update batch counters and error tracking
      if (status === 'completed' || status === 'failed') {
        const countField = status === 'completed' ? 'completed_count' : 'failed_count';
        
        // Get current batch state
        const { data: batch } = await supabase
          .from('sms_batches')
          .select('errors, metrics, ' + countField)
          .eq('id', log.batch_id)
          .single();

        const errors = batch.errors || { categories: {}, samples: [] };
        const metrics = batch.metrics || {
          messages_per_second: 0,
          success_rate: 0,
          credits_used: 0
        };

        // Update batch
        await supabase
          .from('sms_batches')
          .update({
            [countField]: (batch[countField] || 0) + 1,
            errors: status === 'failed' ? {
              ...errors,
              categories: {
                ...errors.categories,
                [metadata.errorCategory || 'unknown']: (errors.categories[metadata.errorCategory || 'unknown'] || 0) + 1
              },
              samples: [
                ...errors.samples,
                {
                  phoneNumber: log.targets,
                  error: metadata.error,
                  category: metadata.errorCategory,
                  timestamp: now
                }
              ].slice(-10) // Keep last 10 samples
            } : errors,
            metrics: {
              ...metrics,
              credits_used: status === 'completed' ? metrics.credits_used + 1 : metrics.credits_used
            },
            updated_at: now
          })
          .eq('id', log.batch_id);

        // Emit batch update
        const updatedBatch = await this.getBatch(log.batch_id);
        if (status === 'failed') {
          emitBatchError(log.batch_id, {
            error: metadata.error,
            state: updatedBatch
          });
        } else {
          emitBatchUpdate(log.batch_id, updatedBatch);
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      throw new Error(`Failed to update message status: ${error.message}`);
    }
  }

  /**
   * Get batch analytics
   */
  async getAnalytics(batchId) {
    try {
      // Get batch and logs
      const { data: batch, error: batchError } = await supabase
        .from('sms_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;

      // Get logs with pagination
      let allLogs = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        console.log(`Fetching analytics logs page ${page} for batch ${batchId}`);
        const { data, error } = await supabase
          .from('sms_batch_log')
          .select('*')
          .eq('batch_id', batchId)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allLogs = allLogs.concat(data);
        console.log(`Retrieved ${data.length} logs for analytics, total so far: ${allLogs.length}`);
        
        if (data.length < pageSize) break;
        page++;
      }

      const analytics = {
        total: allLogs.length,
        completed: allLogs.filter(log => log.status === 'completed').length,
        failed: allLogs.filter(log => log.status === 'failed').length,
        pending: allLogs.filter(log => log.status === 'pending').length,
        success_rate: 0,
        error_categories: {}
      };

      // Calculate success rate
      if (analytics.total > 0) {
        analytics.success_rate = (analytics.completed / analytics.total) * 100;
      }

      // Aggregate error categories
      allLogs
        .filter(log => log.status === 'failed')
        .forEach(log => {
          const category = log.error_category || 'unknown';
          analytics.error_categories[category] = (analytics.error_categories[category] || 0) + 1;
        });

      return analytics;
    } catch (error) {
      console.error('Error getting batch analytics:', error);
      throw new Error(`Failed to get batch analytics: ${error.message}`);
    }
  }
}

export const batchManager = new BatchManager();
