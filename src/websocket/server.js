import { Server } from 'socket.io';
import { batches } from '../models/batch.js';

let io;

export function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle client subscription to batch updates
    socket.on('subscribe:batch', (batchId) => {
      console.log(`Client ${socket.id} subscribed to batch ${batchId}`);
      socket.join(`batch:${batchId}`);
      
      // Send initial batch state
      const batch = batches.get(batchId);
      if (batch) {
        socket.emit('batch:state', {
          batchId,
          state: batch.getState()
        });
      }
    });

    // Handle client unsubscription
    socket.on('unsubscribe:batch', (batchId) => {
      console.log(`Client ${socket.id} unsubscribed from batch ${batchId}`);
      socket.leave(`batch:${batchId}`);
    });

    // Handle batch control actions
    socket.on('batch:pause', async (batchId) => {
      console.log(`Pausing batch ${batchId}`);
      const batch = batches.get(batchId);
      if (batch) {
        try {
          await batch.pause();
          emitBatchUpdate(batchId, batch.getState());
        } catch (error) {
          emitBatchError(batchId, {
            message: 'Failed to pause batch',
            details: error.message
          });
        }
      }
    });

    socket.on('batch:resume', async (batchId) => {
      console.log(`Resuming batch ${batchId}`);
      const batch = batches.get(batchId);
      if (batch) {
        try {
          await batch.resume();
          emitBatchUpdate(batchId, batch.getState());
        } catch (error) {
          emitBatchError(batchId, {
            message: 'Failed to resume batch',
            details: error.message
          });
        }
      }
    });

    socket.on('batch:retry', async (batchId) => {
      console.log(`Retrying batch ${batchId}`);
      const batch = batches.get(batchId);
      if (batch) {
        try {
          await batch.retry();
          emitBatchUpdate(batchId, batch.getState());
        } catch (error) {
          emitBatchError(batchId, {
            message: 'Failed to retry batch',
            details: error.message
          });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

// Emit batch state update to all subscribed clients
export function emitBatchUpdate(batchId, state) {
  if (io) {
    io.to(`batch:${batchId}`).emit('batch:state', {
      batchId,
      state
    });
  }
}

// Emit batch error to all subscribed clients
export function emitBatchError(batchId, error) {
  if (io) {
    io.to(`batch:${batchId}`).emit('batch:error', {
      batchId,
      error
    });
  }
}

// Emit batch completion to all subscribed clients
export function emitBatchComplete(batchId, state) {
  if (io) {
    io.to(`batch:${batchId}`).emit('batch:complete', {
      batchId,
      state
    });
  }
}
