import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { updateBatch } from '@/store/slices/batchesSlice';
import { supabase } from './supabase';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

export function initializeWebSocket() {
  if (socket) return;

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8080', {
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      socket?.close();
    }
  });

  // Batch event handlers
  socket.on('batch:state', async ({ batchId, state }) => {
    try {
      // Update Supabase batch record
      const { error: batchError } = await supabase
        .from('sms_batches')
        .update({
          status: state.status,
          completed_count: state.progress.completed,
          failed_count: state.progress.failed,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (batchError) throw batchError;

      // Update individual message statuses in batch logs if results are provided
      if (state.results && state.results.length > 0) {
        for (const result of state.results) {
          const { error: logError } = await supabase
            .from('sms_batch_log')
            .update({
              status: result.status,
              error: result.error || null,
              updated_at: new Date().toISOString()
            })
            .eq('batch_id', batchId)
            .eq('targets', result.phoneNumber);

          if (logError) {
            console.error('Error updating batch log:', logError);
          }
        }
      }

      // Update Redux store
      store.dispatch(updateBatch({ id: batchId, changes: state }));
    } catch (error) {
      console.error('Error updating batch state in Supabase:', error);
    }
  });

  socket.on('batch:error', async ({ batchId, error, state }) => {
    console.error(`Batch ${batchId} error:`, error);
    try {
      // Update Supabase batch record
      const { error: batchError } = await supabase
        .from('sms_batches')
        .update({
          status: 'failed',
          completed_count: state?.progress?.completed || 0,
          failed_count: state?.progress?.failed || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (batchError) throw batchError;

      // Update individual message statuses if available
      if (state?.results) {
        for (const result of state.results) {
          if (result.status === 'failed') {
            const { error: logError } = await supabase
              .from('sms_batch_log')
              .update({
                status: 'failed',
                error: result.error || error.message,
                updated_at: new Date().toISOString()
              })
              .eq('batch_id', batchId)
              .eq('targets', result.phoneNumber);

            if (logError) {
              console.error('Error updating batch log:', logError);
            }
          }
        }
      } else {
        // Fallback: Update all pending messages as failed
        const { error: logError } = await supabase
          .from('sms_batch_log')
          .update({
            status: 'failed',
            error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('batch_id', batchId)
          .eq('status', 'pending');

        if (logError) throw logError;
      }

      // Update Redux store
      store.dispatch(updateBatch({
        id: batchId,
        changes: {
          status: 'failed',
          errors: [{
            message: error.message,
            timestamp: new Date().toISOString(),
            category: error.category || 'unknown'
          }],
          ...(state && { progress: state.progress })
        }
      }));
    } catch (dbError) {
      console.error('Error updating batch error in Supabase:', dbError);
    }
  });

  socket.on('batch:complete', async ({ batchId, state }) => {
    try {
      // Update Supabase batch record
      const { error: batchError } = await supabase
        .from('sms_batches')
        .update({
          status: 'completed',
          completed_count: state.progress.completed,
          failed_count: state.progress.failed,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (batchError) throw batchError;

      // Update individual message statuses in batch logs
      if (state.results && state.results.length > 0) {
        for (const result of state.results) {
          const { error: logError } = await supabase
            .from('sms_batch_log')
            .update({
              status: result.status,
              error: result.error || null,
              updated_at: new Date().toISOString()
            })
            .eq('batch_id', batchId)
            .eq('targets', result.phoneNumber);

          if (logError) {
            console.error('Error updating batch log:', logError);
          }
        }
      } else {
        // Fallback: Update any remaining pending messages as completed
        const { error: logError } = await supabase
          .from('sms_batch_log')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('batch_id', batchId)
          .eq('status', 'pending');

        if (logError) throw logError;
      }

      // Update Redux store
      store.dispatch(updateBatch({
        id: batchId,
        changes: {
          ...state,
          status: 'completed'
        }
      }));
    } catch (error) {
      console.error('Error updating batch completion in Supabase:', error);
    }
  });
}

export function subscribeToBatch(batchId: string) {
  if (!socket?.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  socket.emit('subscribe:batch', batchId);
}

export function unsubscribeFromBatch(batchId: string) {
  if (!socket?.connected) return;
  socket.emit('unsubscribe:batch', batchId);
}

// Batch control actions
export function pauseBatch(batchId: string) {
  if (!socket?.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  socket.emit('batch:pause', batchId);
}

export function resumeBatch(batchId: string) {
  if (!socket?.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  socket.emit('batch:resume', batchId);
}

export function retryBatch(batchId: string) {
  if (!socket?.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  socket.emit('batch:retry', batchId);
}

export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
