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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

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

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filter?.search && { search: filter.search }),
        ...(filter?.status?.length && { status: filter.status.join(',') }),
        ...(filter?.dateRange?.start && { startDate: filter.dateRange.start }),
        ...(filter?.dateRange?.end && { endDate: filter.dateRange.end }),
        ...(filter?.sortBy && { sortBy: filter.sortBy }),
        ...(filter?.sortOrder && { sortOrder: filter.sortOrder })
      });

      const { data: response } = await api.get<ApiResponse<{
        batches: Batch[];
        total: number;
      }>>(`/api/batch?${params.toString()}`);

      const { batches, total } = response;
      dispatch(setBatches(batches));
      dispatch(setTotal(total));
      
      return { batches, total };
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
      console.log('Creating batch:', batchData);

      const { data: response } = await api.post<ApiResponse<Batch>>('/api/batch', {
        name: batchData.name,
        template: {
          id: batchData.template?.id,
          text: batchData.template?.content,
        },
        recipients: batchData.customers.map(customer => ({
          phoneNumber: customer.phone,
          variables: {
            ...batchData.variables,
            customer: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
            },
          },
        })),
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

      console.log('Batch created:', response);
      return response;
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
      console.log('Starting batch:', batchId);

      const { data: response } = await api.post<ApiResponse<Batch>>(`/api/batch/${batchId}/resume`, {});
      console.log('Batch started:', response);
      return response;
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

      const { data: response } = await api.post<ApiResponse<Batch>>(`/api/batch/${batchId}/cancel`, {});
      console.log('Batch cancelled:', response);
      return response;
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
      const { data: response } = await api.get<ApiResponse<BatchStats>>('/api/batch/analytics');
      dispatch(setStats(response));
      return response;
    } catch (error) {
      console.error('Error fetching batch stats:', error);
      throw new Error(handleError(error));
    }
  }
);
