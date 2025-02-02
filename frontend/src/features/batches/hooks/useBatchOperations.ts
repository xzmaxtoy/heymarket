import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import api from '@/services/api';
import { 
  BatchCreationState, 
  BatchStatus,
} from '../types';
import { Customer } from '@/types/customer';
import { updateBatch } from '@/store/slices/batchesSlice';

// Valid customer properties that can be used in variables
const VALID_CUSTOMER_PROPS = ['id', 'name', 'phone', 'email', 'city', 'address'] as const;
type ValidCustomerProp = typeof VALID_CUSTOMER_PROPS[number];

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
      // Create batch with autoStart: false
      const response = await api.post<ApiResponse>('/api/batch', {
        text: batchData.template?.content,
        recipients: batchData.customers.map(customer => {
          // Generate customer-specific variables
          const customerVariables = Object.entries(batchData.variables).reduce((acc, [key, value]) => {
            // Replace any {{customer.xxx}} variables in the value
            const processedValue = typeof value === 'string' 
              ? value.replace(/\{\{customer\.(.*?)\}\}/g, (_, prop) => {
                  // Only allow specific customer properties
                  if (VALID_CUSTOMER_PROPS.includes(prop as ValidCustomerProp)) {
                    return customer[prop as ValidCustomerProp]?.toString() || '';
                  }
                  return '';
                })
              : value;
            return { ...acc, [key]: processedValue };
          }, {});

          return {
            phoneNumber: customer.phone,
            variables: {
              ...customerVariables,
              customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
              },
            },
          };
        }),
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
