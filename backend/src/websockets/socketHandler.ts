import { Server, Socket } from 'socket.io';
import { prisma } from '../server';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupWebSockets = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room for specific table
    socket.on('join:table', (tableId: string) => {
      socket.join(`table:${tableId}`);
      logger.info(`Socket ${socket.id} joined table:${tableId}`);
    });

    // Leave table room
    socket.on('leave:table', (tableId: string) => {
      socket.leave(`table:${tableId}`);
      logger.info(`Socket ${socket.id} left table:${tableId}`);
    });

    // Join kitchen room
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
      logger.info(`Socket ${socket.id} joined kitchen`);
    });

    // Join waiter room
    socket.on('join:waiter', () => {
      socket.join('waiters');
      logger.info(`Socket ${socket.id} joined waiters`);
    });

    // Join reception room
    socket.on('join:reception', () => {
      socket.join('reception');
      logger.info(`Socket ${socket.id} joined reception`);
    });

    // Handle order status updates from clients
    socket.on('order:statusUpdate', async (data: { orderId: string; status: string }) => {
      try {
        const { orderId, status } = data;
        
        // Broadcast to all connected clients
        io.emit('order:statusChanged', { orderId, status });
        
        logger.info(`Order ${orderId} status updated to ${status}`);
      } catch (error) {
        logger.error('Socket order status update error:', error);
      }
    });

    // Handle item status updates
    socket.on('item:statusUpdate', async (data: { itemId: string; orderId: string; status: string; tableId: string }) => {
      try {
        const { itemId, orderId, status, tableId } = data;
        
        // Broadcast to kitchen and table
        io.to('kitchen').emit('item:statusChanged', { itemId, orderId, status });
        io.to(`table:${tableId}`).emit('item:statusChanged', { itemId, orderId, status });
        
        logger.info(`Order item ${itemId} status updated to ${status}`);
      } catch (error) {
        logger.error('Socket item status update error:', error);
      }
    });

    // Handle bill request
    socket.on('bill:request', async (data: { tableId: string; orderId: string }) => {
      try {
        const { tableId, orderId } = data;
        
        // Notify waiters
        io.to('waiters').emit('bill:requested', { tableId, orderId });
        io.to('reception').emit('bill:requested', { tableId, orderId });
        
        logger.info(`Bill requested for table ${tableId}, order ${orderId}`);
      } catch (error) {
        logger.error('Socket bill request error:', error);
      }
    });

    // Handle new order notification
    socket.on('order:new', async (data: { orderId: string; tableId: string }) => {
      try {
        const { orderId, tableId } = data;
        
        // Notify kitchen and waiters
        io.to('kitchen').emit('order:received', { orderId, tableId });
        io.to('waiters').emit('order:received', { orderId, tableId });
        io.to('reception').emit('order:received', { orderId, tableId });
        
        logger.info(`New order ${orderId} received for table ${tableId}`);
      } catch (error) {
        logger.error('Socket new order error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const sockets = io.sockets.sockets;
    sockets.forEach((socket) => {
      // Check if socket is still active
      if (!socket.connected) {
        socket.disconnect(true);
      }
    });
  }, 60000); // Every minute
};

// Helper function to emit events to specific rooms
export const emitToRoom = (io: Server, room: string, event: string, data: any) => {
  io.to(room).emit(event, data);
};

// Helper function to emit to all clients
export const emitToAll = (io: Server, event: string, data: any) => {
  io.emit(event, data);
};
