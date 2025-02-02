import { updateBatchStatus, updateBatchLogs, createBatchErrorLog, completeBatch, supabase } from '../services/supabase.js';
import { emitBatchUpdate, emitBatchError, emitBatchComplete } from '../websocket/server.js';

/**
 * Manages batch state and handles persistence to Supabase
 */
class BatchState {
  constructor(batchId, initialState = {}) {
    this.id = batchId;
    this.status = initialState.status || 'pending';
    this.progress = {
      total: initialState.total_recipients || 0,
      pending: initialState.total_recipients || 0,
      processing: 0,
      completed: initialState.completed_count || 0,
      failed: initialState.failed_count || 0
    };
    this.timing = {
      created: initialState.created_at || new Date().toISOString(),
      started: null,
      estimated_completion: null
    };
    this.errors = {
      categories: {},
      samples: []
    };
    this.metrics = {
      messages_per_second: 0,
      success_rate: 0,
      credits_used: 0
    };
    this.results = [];
  }

  /**
   * Start batch processing
   */
  async start() {
    if (this.status === 'completed' || this.status === 'failed') {
      throw new Error(`Cannot start batch in ${this.status} status`);
    }

    this.status = 'processing';
    this.timing.started = new Date().toISOString();

    try {
      // First try to update with started_at column
      try {
        await updateBatchStatus(this.id, {
          status: this.status,
          started_at: this.timing.started
        });
      } catch (error) {
        if (error.message?.includes("'started_at' column")) {
          // Add started_at column if it doesn't exist
          await supabase.rpc('add_column_if_not_exists', {
            table_name: 'sms_batches',
            column_name: 'started_at',
            column_type: 'timestamp with time zone'
          });
          
          // Retry update
          await updateBatchStatus(this.id, {
            status: this.status,
            started_at: this.timing.started
          });
        } else {
          throw error;
        }
      }

      await updateBatchLogs(this.id, this.status);
      this.emitUpdate();
    } catch (error) {
      console.error('Error updating batch start state:', error);
      throw error;
    }
  }

  /**
   * Record message processing result
   */
  async recordResult(result) {
    this.results.push(result);
    this.progress.processing--;

    if (result.status === 'success') {
      this.progress.completed++;
      this.metrics.credits_used++;
    } else if (result.status === 'failed') {
      this.progress.failed++;
      
      // Categorize error
      const category = result.errorCategory || 'unknown';
      this.errors.categories[category] = (this.errors.categories[category] || 0) + 1;
      
      if (this.errors.samples.length < 10) {
        this.errors.samples.push({
          error: result.error,
          category,
          timestamp: result.timestamp,
          rateLimitInfo: result.rateLimitInfo
        });
      }
    }

    try {
      await updateBatchStatus(this.id, {
        completed_count: this.progress.completed,
        failed_count: this.progress.failed
      });

      if (result.status === 'failed') {
        await createBatchErrorLog(this.id, {
          error: result.error,
          category: result.errorCategory,
          rateLimitInfo: result.rateLimitInfo
        });
      }

      this.emitUpdate();
    } catch (error) {
      console.error('Error updating batch progress:', error);
    }
  }

  /**
   * Start processing a message
   */
  startProcessingMessage() {
    this.progress.pending--;
    this.progress.processing++;
    this.emitUpdate();
  }

  /**
   * Update metrics
   */
  updateMetrics(startTime) {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    this.metrics.messages_per_second = (this.progress.completed + this.progress.failed) / elapsedSeconds;
    this.metrics.success_rate = (this.progress.completed / (this.progress.completed + this.progress.failed)) * 100;
  }

  /**
   * Complete batch processing
   */
  async complete() {
    this.status = 'completed';
    
    try {
      await completeBatch(this.id, this.getState());
      emitBatchComplete(this.id, this.getState());
    } catch (error) {
      console.error('Error completing batch:', error);
      throw error;
    }
  }

  /**
   * Mark batch as failed
   */
  async fail(error) {
    this.status = 'failed';
    
    try {
      // First try to update with error column
      try {
        await updateBatchStatus(this.id, {
          status: 'failed',
          error: error.message
        });
      } catch (updateError) {
        if (updateError.message?.includes("'error' column")) {
          // Add error column if it doesn't exist
          await supabase.rpc('add_column_if_not_exists', {
            table_name: 'sms_batches',
            column_name: 'error',
            column_type: 'text'
          });
          
          // Retry update
          await updateBatchStatus(this.id, {
            status: 'failed',
            error: error.message
          });
        } else {
          throw updateError;
        }
      }

      await createBatchErrorLog(this.id, {
        error: error.message,
        category: 'system'
      });
      emitBatchError(this.id, {
        error: error.message,
        state: this.getState()
      });
    } catch (updateError) {
      console.error('Error updating failed batch:', updateError);
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      batchId: this.id,
      status: this.status,
      progress: this.progress,
      timing: this.timing,
      errors: this.errors,
      metrics: this.metrics
    };
  }

  /**
   * Emit state update via WebSocket
   */
  emitUpdate() {
    emitBatchUpdate(this.id, this.getState());
  }
}

export default BatchState;
