import { createAsyncThunk } from '@reduxjs/toolkit';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { 
  Batch,
  BatchFilter,
  BatchStats,
  BatchCreationState,
  BatchStatus,
} from '@/features/batches/types';
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
    try {
      const { data, error } = await supabase
        .from('sms_batches')
        .insert({
          name: batchData.name,
          template_id: batchData.template?.id,
          status: 'pending' as BatchStatus,
          total_recipients: batchData.customers.length,
          completed_count: 0,
          failed_count: 0,
          scheduled_for: batchData.scheduledFor,
        })
        .select()
        .single();

      if (error) throw error;

      // Create batch logs for each customer
      const batchLogs = batchData.customers.map(customer => ({
        batch_id: data.id,
        targets: customer.phone,
        message: batchData.template?.content || '',
        variables: {
          ...batchData.variables,
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
          },
        },
        status: 'pending',
      }));

      const { error: logsError } = await supabase
        .from('sms_batch_log')
        .insert(batchLogs);

      if (logsError) throw logsError;

      return data as Batch;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw new Error(handleError(error));
    }
  }
);

// Start batch
export const startBatch = createAsyncThunk(
  'batches/startBatch',
  async (batchId: string) => {
    try {
      // Call the resume endpoint to start the batch
      const response = await fetch(`/api/batch/${batchId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start batch');
      }

      const { data } = await response.json();
      return data as Batch;
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
      const { data, error } = await supabase
        .from('sms_batches')
        .update({ status: 'cancelled' })
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;

      // Update pending batch logs to cancelled
      const { error: logsError } = await supabase
        .from('sms_batch_log')
        .update({ status: 'cancelled' })
        .eq('batch_id', batchId)
        .eq('status', 'pending');

      if (logsError) throw logsError;

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