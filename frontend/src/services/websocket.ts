import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { updateBatch } from '@/store/slices/batchesSlice';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Track subscribed batches and their callbacks
const subscriptionCallbacks = new Map<string, (data: any) => void>();

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
    // Clear subscriptions on disconnect
    subscriptionCallbacks.clear();
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      socket?.close();
      subscriptionCallbacks.clear();
    }
  });

  // Batch event handlers
  socket.on('batch:state', ({ batchId, state }) => {
    const callback = subscriptionCallbacks.get(batchId);
    if (callback) {
      // Only emit log if status has changed
      const currentBatch = store.getState().batches.items.find(b => b.id === batchId);
      if (state.status !== currentBatch?.status) {
        callback({
          type: 'log',
          logType: 'info',
          message: `Batch state updated: ${state.status}`,
          details: state
        });
      }

      store.dispatch(updateBatch({ 
        id: batchId, 
        changes: {
          ...state,
          updated_at: new Date().toISOString()
        }
      }));
    }
  });

  socket.on('batch:error', ({ batchId, error }) => {
    const callback = subscriptionCallbacks.get(batchId);
    if (callback) {
      callback({
        type: 'log',
        logType: 'error',
        message: error.message,
        details: error
      });

      store.dispatch(updateBatch({
        id: batchId,
        changes: {
          status: 'failed',
          errors: [{
            message: error.message,
            timestamp: new Date().toISOString(),
            category: error.category || 'unknown'
          }],
          updated_at: new Date().toISOString()
        }
      }));
    }
  });

  socket.on('batch:complete', ({ batchId, state }) => {
    const callback = subscriptionCallbacks.get(batchId);
    if (callback) {
      callback({
        type: 'log',
        logType: 'success',
        message: 'Batch completed successfully',
        details: state
      });

      store.dispatch(updateBatch({
        id: batchId,
        changes: {
          ...state,
          status: 'completed',
          updated_at: new Date().toISOString()
        }
      }));

      // Automatically unsubscribe from completed batches
      unsubscribeFromBatch(batchId);
    }
  });

  // Log event handlers
  socket.on('batch:log', ({ batchId, log }) => {
    const callback = subscriptionCallbacks.get(batchId);
    if (callback) {
      callback({
        type: 'log',
        logType: log.level || 'info',
        message: log.message,
        details: log.details
      });
    }
  });
}

export function subscribeToBatch(batchId: string, callback: (data: any) => void) {
  if (!socket?.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  // Always update callback even if already subscribed to ensure latest callback is used
  subscriptionCallbacks.set(batchId, callback);
  
  if (!socket.hasListeners(`batch:${batchId}`)) {
    socket.emit('subscribe:batch', batchId);
    console.log(`Subscribed to batch ${batchId}`);
  }
}

export function unsubscribeFromBatch(batchId: string) {
  if (!socket?.connected) return;
  if (subscriptionCallbacks.has(batchId)) {
    socket.emit('unsubscribe:batch', batchId);
    subscriptionCallbacks.delete(batchId);
    console.log(`Unsubscribed from batch ${batchId}`);
  }
}

// Initialize socket connection if not already connected
export function ensureSocketConnection() {
  if (!socket) {
    initializeWebSocket();
  }
  return socket?.connected || false;
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
    subscriptionCallbacks.clear();
  }
}
