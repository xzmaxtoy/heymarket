import { createAsyncThunk } from '@reduxjs/toolkit';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import api from '@/services/api';
import { 
  Batch,
  BatchFilter,
  BatchStats,
  BatchCreationState,
  BatchStatus,
} from '@/features/batches/types';
import { extractTemplateVariables, extractRequiredVariables } from '@/utils/templateUtils';
import {
  setBatches,
  setLoading,
  setError,
  setTotal,
  setStats,
} from '../slices/batchesSlice';

// Error handling helper
const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if ((error as PostgrestError)?.message) return (error as PostgrestError).message;
  return 'An unknown error occurred';
};

// Create Supabase batch record
const createBatchRecord = async (batchData: BatchCreationState): Promise<Batch> => {
  // Filter out customers with no phone number
  const validCustomers = batchData.customers.filter(customer => customer.phone);
  if (validCustomers.length === 0) {
    throw new Error('No valid phone numbers found in selected customers');
  }

  const { data, error } = await supabase
    .from('sms_batches')
    .insert({
      name: batchData.name,
      template_id: batchData.template?.id,
      status: 'pending' as BatchStatus,
      total_recipients: validCustomers.length,
      completed_count: 0,
      failed_count: 0,
      scheduled_for: batchData.scheduledFor,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create batch record');
  
  return data;
};

// Create batch logs
const createBatchLogs = async (batchId: string, batchData: BatchCreationState) => {
  // Extract variables used in template
  const templateContent = batchData.template?.content || '';
  const usedVariables = extractTemplateVariables(templateContent);

  // Create logs with only required variables for valid customers
  const batchLogs = batchData.customers
    .filter(customer => customer.phone) // Filter out customers with no phone number
    .map(customer => {
      // Extract only the variables used in template
      const customerVars = extractRequiredVariables(customer, usedVariables);
      
      return {
        batch_id: batchId,
        targets: customer.phone,
        message: templateContent,
        variables: customerVars,
        status: 'pending',
      };
    });

  if (batchLogs.length === 0) {
    throw new Error('No valid phone numbers found in selected customers');
  }

  const { error } = await supabase
    .from('sms_batch_log')
    .insert(batchLogs);

  if (error) throw error;
};

// Fetch batches
export const fetchBatches = createAsyncThunk(
  'batches/fetchBatches',
  async ({ 
    page, 
    pageSize, 
    filter 
  }: { 
    page: number; 
    pageSize: number; 
    filter?: BatchFilter 
  }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      
      let query = supabase
        .from('sms_batches')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%`);
      }

      if (filter?.status?.length) {
        query = query.in('status', filter.status);
      }

      if (filter?.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start)
          .lte('created_at', filter.dateRange.end);
      }

      // Apply sorting
      if (filter?.sortBy) {
        query = query.order(filter.sortBy, { 
          ascending: filter.sortOrder === 'asc' 
        });
      } else {
        // Default sort by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      dispatch(setBatches(data as Batch[]));
      dispatch(setTotal(count || 0));
      
      return {
        batches: data as Batch[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching batches:', error);
      const errorMessage = handleError(error);
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create batch
export const createBatch = createAsyncThunk(
  'batches/createBatch',
  async (batchData: BatchCreationState) => {
    let batchRecord: Batch | null = null;

    try {
      console.log('Creating batch in Supabase:', batchData);

      // Filter out customers with no phone number
      const validCustomers = batchData.customers.filter(customer => customer.phone);
      if (validCustomers.length === 0) {
        throw new Error('No valid phone numbers found in selected customers');
      }

      // Create batch record with valid customers only
      const batchDataWithValidCustomers = {
        ...batchData,
        customers: validCustomers
      };
      batchRecord = await createBatchRecord(batchDataWithValidCustomers);
      console.log('Batch created in Supabase:', batchRecord);

      // Extract variables used in template
      const usedVariables = extractTemplateVariables(batchData.template?.content || '');

      // Create batch logs and prepare recipient data for valid customers only
      const recipients = validCustomers.map(customer => {
        // Extract only the variables used in template
        const customerVars = extractRequiredVariables(customer, usedVariables);
        return {
          phoneNumber: customer.phone,
          variables: customerVars,
        };
      });

      // Create batch logs
      await createBatchLogs(batchRecord.id, batchDataWithValidCustomers);
      console.log('Batch logs created in Supabase');

      // Create batch in backend
      try {
        console.log('Creating batch in backend API');

        await api.post('/api/v2/batch', {
          batchId: batchRecord.id,
          templateId: batchData.template?.id,
          recipients,
          options: {
            scheduleTime: batchData.scheduledFor,
            priority: 'normal',
            autoStart: false,
            retryStrategy: {
              maxAttempts: 3,
              backoffMinutes: 5,
            },
          },
        });

        console.log('Batch created in backend API');
      } catch (error) {
        // Log but don't throw backend errors since Supabase operations succeeded
        console.error('Error creating batch in backend (continuing):', error);
      }

      return batchRecord;
    } catch (error) {
      console.error('Error creating batch:', error);

      // If we created the batch in Supabase but failed later, try to mark it as failed
      if (batchRecord) {
        try {
          await supabase
            .from('sms_batches')
            .update({ status: 'failed' })
            .eq('id', batchRecord.id);
        } catch (updateError) {
          console.error('Error updating failed batch status:', updateError);
        }
      }

      throw new Error(handleError(error));
    }
  }
);

// Start batch
export const startBatch = createAsyncThunk(
  'batches/startBatch',
  async (batchId: string) => {
    try {
      console.log('Starting batch:', batchId);

      // Call backend resume endpoint
      try {
        await api.post(`/api/v2/batch/${batchId}/resume`, {});
        console.log('Backend batch started');
      } catch (error) {
        console.error('Error starting batch in backend:', error);
        throw error; // Throw error since this is critical
      }

      // Update Supabase status
      const { data: updatedBatch, error: updateError } = await supabase
        .from('sms_batches')
        .update({ 
          status: 'processing',
          scheduled_for: null // Clear scheduled time when starting immediately
        })
        .eq('id', batchId)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedBatch) throw new Error('Failed to update batch status');

      console.log('Batch started:', updatedBatch);
      return updatedBatch as Batch;
    } catch (error) {
      console.error('Error starting batch:', error);
      throw new Error(handleError(error));
    }
  }
);

// Cancel batch
export const cancelBatch = createAsyncThunk(
  'batches/cancelBatch',
  async (batchId: string) => {
    try {
      console.log('Cancelling batch:', batchId);

      const { data, error } = await supabase
        .from('sms_batches')
        .update({ status: 'cancelled' })
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to cancel batch');

      // Update pending batch logs to cancelled
      const { error: logsError } = await supabase
        .from('sms_batch_log')
        .update({ status: 'cancelled' })
        .eq('batch_id', batchId)
        .eq('status', 'pending');

      if (logsError) throw logsError;

      console.log('Batch cancelled:', data);
      return data as Batch;
    } catch (error) {
      console.error('Error cancelling batch:', error);
      throw new Error(handleError(error));
    }
  }
);

// Fetch batch stats
export const fetchBatchStats = createAsyncThunk(
  'batches/fetchBatchStats',
  async (_, { dispatch }) => {
    try {
      const { data: batches, error } = await supabase
        .from('sms_batches')
        .select('*');

      if (error) throw error;
      if (!batches) throw new Error('Failed to fetch batch stats');

      const stats: BatchStats = {
        totalBatches: batches.length,
        completedBatches: batches.filter(b => b.status === 'completed').length,
        failedBatches: batches.filter(b => b.status === 'failed').length,
        successRate: batches.length > 0 
          ? (batches.reduce((acc, b) => acc + (b.completed_count || 0), 0) / 
             batches.reduce((acc, b) => acc + (b.total_recipients || 0), 0)) * 100
          : 0,
        averageDeliveryTime: 0, // TODO: Calculate from batch logs
      };

      dispatch(setStats(stats));
      return stats;
    } catch (error) {
      console.error('Error fetching batch stats:', error);
      throw new Error(handleError(error));
    }
  }
);
