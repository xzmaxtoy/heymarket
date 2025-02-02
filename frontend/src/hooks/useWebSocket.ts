import { useEffect, useCallback } from 'react';
import { subscribeToBatch, unsubscribeFromBatch, ensureSocketConnection } from '@/services/websocket';

export const useWebSocket = () => {
  useEffect(() => {
    ensureSocketConnection();
  }, []);

  const subscribe = useCallback((batchId: string, callback: (data: any) => void) => {
    subscribeToBatch(batchId, callback);
  }, []);

  const unsubscribe = useCallback((batchId: string) => {
    unsubscribeFromBatch(batchId);
  }, []);

  return {
    subscribe,
    unsubscribe
  };
};
