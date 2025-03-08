import { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import api from '@/services/api';
import { updateBatch } from '@/store/slices/batchesSlice';
import { Batch } from '../types';

const POLLING_INTERVAL = 2000; // 2 seconds

export const useBatchStatus = (batchId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isPolling, setIsPolling] = useState(false);

  const fetchBatchStatus = useCallback(async () => {
    if (!batchId) return;

    try {
      const response = await api.get(`/api/batch/${batchId}/status`);
      // Cast response to any to avoid TypeScript errors in quick fix mode
      const batchStatus = (response as any)?.data;

      // Update Redux store with new status
      dispatch(updateBatch({
        id: batchId,
        changes: {
          status: batchStatus.status,
          completed_count: batchStatus.progress.completed,
          failed_count: batchStatus.progress.failed,
          total_recipients: batchStatus.progress.total,
        }
      }));

      // Stop polling if batch is completed or failed
      if (['completed', 'failed', 'cancelled'].includes(batchStatus.status)) {
        setIsPolling(false);
      }

      return batchStatus;
    } catch (error) {
      console.error('Error fetching batch status:', error);
      // Stop polling on error
      setIsPolling(false);
      throw error;
    }
  }, [batchId, dispatch]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!batchId || isPolling) return;
    setIsPolling(true);
  }, [batchId, isPolling]);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Set up polling interval
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(fetchBatchStatus, POLLING_INTERVAL);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isPolling, fetchBatchStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling,
    fetchBatchStatus,
  };
};

export default useBatchStatus;
