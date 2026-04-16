import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';
import { io } from '../server';

export const getKitchenOrders = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'kitchen:orders';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING']
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        table: {
          select: { id: true, number: true, name: true }
        },
        items: {
          where: {
            status: {
              in: ['PENDING', 'PREPARING']
            }
          },
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        }
      }
    });

    // Filter out orders with no pending items
    const filteredOrders = orders.filter(order => order.items.length > 0);

    await redis.setex(cacheKey, 30, JSON.stringify(filteredOrders));
    res.json(filteredOrders);
  } catch (error) {
    logger.error('Get kitchen orders error:', error);
    res.status(500).json({ error: 'Failed to get kitchen orders' });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: {
          select: { id: true, number: true, name: true }
        },
        items: {
          include: {
            menuItem: true
          }
        },
        placedBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
};

export const markItemPreparing = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            table: true
          }
        },
        menuItem: true
      }
    });

    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'PREPARING' }
    });

    // Update order status if needed
    if (orderItem.order.status === 'PENDING' || orderItem.order.status === 'CONFIRMED') {
      await prisma.order.update({
        where: { id: orderItem.orderId },
        data: { status: 'PREPARING' }
      });
    }

    await redis.del('kitchen:orders');
    await redis.del('orders:active');
    
    await createAuditLog(req.user?.userId, 'MARK_PREPARING', 'OrderItem', itemId, undefined, undefined, req);

    // Notify clients
    io.emit('orderItem:preparing', {
      itemId,
      orderId: orderItem.orderId,
      tableId: orderItem.order.tableId,
      itemName: orderItem.menuItem.name
    });

    res.json(updatedItem);
  } catch (error) {
    logger.error('Mark item preparing error:', error);
    res.status(500).json({ error: 'Failed to mark item as preparing' });
  }
};

export const markItemReady = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            table: true
          }
        },
        menuItem: true
      }
    });

    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'READY' }
    });

    await redis.del('kitchen:orders');
    await redis.del('orders:active');
    
    await createAuditLog(req.user?.userId, 'MARK_READY', 'OrderItem', itemId, undefined, undefined, req);

    // Notify clients
    io.emit('orderItem:ready', {
      itemId,
      orderId: orderItem.orderId,
      tableId: orderItem.order.tableId,
      tableNumber: orderItem.order.table.number,
      itemName: orderItem.menuItem.name
    });

    // Check if all items are ready
    const pendingItems = await prisma.orderItem.count({
      where: {
        orderId: orderItem.orderId,
        status: { in: ['PENDING', 'PREPARING'] }
      }
    });

    if (pendingItems === 0) {
      await prisma.order.update({
        where: { id: orderItem.orderId },
        data: { status: 'READY' }
      });

      io.emit('order:ready', {
        orderId: orderItem.orderId,
        tableId: orderItem.order.tableId,
        tableNumber: orderItem.order.table.number
      });
    }

    res.json(updatedItem);
  } catch (error) {
    logger.error('Mark item ready error:', error);
    res.status(500).json({ error: 'Failed to mark item as ready' });
  }
};

export const markOrderReady = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update all items to ready
    await prisma.orderItem.updateMany({
      where: { orderId: id },
      data: { status: 'READY' }
    });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'READY' },
      include: {
        table: {
          select: { id: true, number: true, name: true }
        },
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    await redis.del('kitchen:orders');
    await redis.del('orders:active');
    
    await createAuditLog(req.user?.userId, 'MARK_ORDER_READY', 'Order', id, undefined, undefined, req);

    // Notify clients
    io.emit('order:ready', {
      orderId: id,
      tableId: order.tableId,
      tableNumber: order.table.number
    });

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Mark order ready error:', error);
    res.status(500).json({ error: 'Failed to mark order as ready' });
  }
};

export const getKitchenStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingItems,
      preparingItems,
      readyItems,
      todayOrders,
      averagePreparationTime
    ] = await Promise.all([
      prisma.orderItem.count({
        where: {
          status: 'PENDING',
          order: {
            status: { notIn: ['PAID', 'CANCELLED'] }
          }
        }
      }),
      prisma.orderItem.count({
        where: {
          status: 'PREPARING'
        }
      }),
      prisma.orderItem.count({
        where: {
          status: 'READY'
        }
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' }
        }
      }),
      // Calculate average time from PENDING to READY
      prisma.orderItem.findMany({
        where: {
          status: 'READY',
          updatedAt: { gte: today }
        },
        select: {
          createdAt: true,
          updatedAt: true
        },
        take: 100
      })
    ]);

    // Calculate average preparation time
    let avgTimeMinutes = 0;
    if (averagePreparationTime.length > 0) {
      const totalMinutes = averagePreparationTime.reduce((sum, item) => {
        const diff = item.updatedAt.getTime() - item.createdAt.getTime();
        return sum + (diff / 1000 / 60);
      }, 0);
      avgTimeMinutes = Math.round(totalMinutes / averagePreparationTime.length);
    }

    res.json({
      items: {
        pending: pendingItems,
        preparing: preparingItems,
        ready: readyItems
      },
      todayOrders,
      averagePreparationTime: avgTimeMinutes
    });
  } catch (error) {
    logger.error('Get kitchen stats error:', error);
    res.status(500).json({ error: 'Failed to get kitchen stats' });
  }
};
