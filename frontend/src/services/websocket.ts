import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { updateBatch } from '@/store/slices/batchesSlice';

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
  socket.on('batch:state', ({ batchId, state }) => {
    store.dispatch(updateBatch({ id: batchId, changes: state }));
  });

  socket.on('batch:error', ({ batchId, error }) => {
    console.error(`Batch ${batchId} error:`, error);
    store.dispatch(updateBatch({
      id: batchId,
      changes: {
        status: 'failed',
        errors: [{
          message: error.message,
          timestamp: new Date().toISOString(),
          category: error.category || 'unknown'
        }]
      }
    }));
  });

  socket.on('batch:complete', ({ batchId, state }) => {
    store.dispatch(updateBatch({
      id: batchId,
      changes: {
        ...state,
        status: 'completed'
      }
    }));
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

export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
