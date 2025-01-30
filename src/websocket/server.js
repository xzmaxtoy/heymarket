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
