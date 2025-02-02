import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import api from '@/services/api';
import { 
  BatchCreationState, 
  BatchStatus,
} from '../types';
import { updateBatch } from '@/store/slices/batchesSlice';
import { extractTemplateVariables, extractRequiredVariables } from '@/utils/templateUtils';

interface BatchResponseData {
  batchId: string;
  status: BatchStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: BatchResponseData;
}

export const useBatchOperations = () => {
  const dispatch = useAppDispatch();

  const createBatch = useCallback(async (batchData: BatchCreationState) => {
    try {
      // Extract variables used in template
      const templateContent = batchData.template?.content || '';
      const usedVariables = extractTemplateVariables(templateContent);

      // Create batch with autoStart: false
      const recipients = batchData.customers.map(customer => ({
        phoneNumber: customer.phone,
        variables: extractRequiredVariables(customer, usedVariables),
      }));

      const response = await api.post<ApiResponse>('/api/batch', {
        text: templateContent,
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

      const { batchId } = response.data;

      // Resume batch processing
      const resumeResponse = await api.post<ApiResponse>(`/api/batch/${batchId}/resume`, {});
      const { progress } = resumeResponse.data;

      // Update batch status in Redux store
      const statusUpdate = {
        id: batchId,
        status: 'processing' as BatchStatus,
        completed_count: progress.completed,
        failed_count: progress.failed,
        total_recipients: progress.total,
      };
      dispatch(updateBatch({ id: batchId, changes: statusUpdate }));

      return response.data;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }, [dispatch]);

  const resumeBatch = useCallback(async (batchId: string) => {
    try {
      const response = await api.post<ApiResponse>(`/api/batch/${batchId}/resume`, {});
      const { progress } = response.data;
      
      // Update batch status in Redux store
      const statusUpdate = {
        id: batchId,
        status: 'processing' as BatchStatus,
        completed_count: progress.completed,
        failed_count: progress.failed,
        total_recipients: progress.total,
      };
      dispatch(updateBatch({ id: batchId, changes: statusUpdate }));

      return response.data;
    } catch (error) {
      console.error('Error resuming batch:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    createBatch,
    resumeBatch,
  };
};

export default useBatchOperations;
