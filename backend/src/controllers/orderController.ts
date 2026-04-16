import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';
import { io } from '../server';
import { OrderStatus, OrderItemStatus } from '@prisma/client';

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.10');

// Calculate order totals
const calculateOrderTotals = (items: Array<{ quantity: number; unitPrice: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;
  
  return {
    subtotal,
    taxAmount,
    totalAmount
  };
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, tableId, from, to, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (tableId) {
      where.tableId = tableId;
    }
    
    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from as string);
      }
      if (to) {
        where.createdAt.lte = new Date(to as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          table: {
            select: { id: true, number: true, name: true }
          },
          placedBy: {
            select: { id: true, name: true }
          },
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

export const getActiveOrders = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'orders:active';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const orders = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: {
          select: { id: true, number: true, name: true }
        },
        placedBy: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        }
      }
    });

    await redis.setex(cacheKey, 30, JSON.stringify(orders));
    res.json(orders);
  } catch (error) {
    logger.error('Get active orders error:', error);
    res.status(500).json({ error: 'Failed to get active orders' });
  }
};

export const getOrdersByTable = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const { active } = req.query;

    const where: any = { tableId };
    
    if (active === 'true') {
      where.status = {
        notIn: ['PAID', 'CANCELLED']
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        }
      }
    });

    res.json(orders);
  } catch (error) {
    logger.error('Get orders by table error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: {
          select: { id: true, number: true, name: true }
        },
        placedBy: {
          select: { id: true, name: true }
        },
        servedBy: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableId, qrSessionToken, items, notes } = req.body;

    // Verify table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Validate QR session if provided
    let qrSessionId: string | undefined;
    if (qrSessionToken) {
      const session = await prisma.qRSession.findUnique({
        where: { token: qrSessionToken }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired QR session' });
      }

      if (session.tableId !== tableId) {
        return res.status(400).json({ error: 'QR session does not match table' });
      }

      qrSessionId = session.id;
    }

    // Get menu item details and validate
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true
      }
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'Some menu items are unavailable or do not exist' });
    }

    // Prepare order items
    const orderItems = items.map((item: any) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem!.price,
        totalPrice: menuItem!.price.toNumber() * item.quantity,
        notes: item.notes
      };
    });

    // Calculate totals
    const { taxAmount, totalAmount } = calculateOrderTotals(orderItems);

    // Create order
    const order = await prisma.order.create({
      data: {
        tableId,
        qrSessionId,
        notes,
        taxAmount,
        totalAmount,
        placedById: req.user?.userId,
        items: {
          create: orderItems
        }
      },
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

    // Update table status if needed
    if (table.status === 'FREE') {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });
      await redis.del('tables:all');
    }

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId || 'customer', 'CREATE', 'Order', order.id, undefined, { tableId, totalAmount }, req);

    // Notify kitchen and waiters
    io.emit('order:created', order);
    io.to(`table:${tableId}`).emit('order:updated', order);

    res.status(201).json(order);
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const oldOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!oldOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData: any = { status };
    
    if (status === 'SERVED') {
      updateData.servedById = req.user?.userId;
    }
    
    if (status === 'PAID') {
      updateData.completedAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId, 'UPDATE_STATUS', 'Order', id, { status: oldOrder.status }, { status }, req);

    // Notify clients
    io.emit('order:statusChanged', { orderId: id, status, tableId: order.tableId });
    io.to(`table:${order.tableId}`).emit('order:updated', order);

    res.json(order);
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const updateOrderItemStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { status } = req.body;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status }
    });

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId, 'UPDATE_ITEM_STATUS', 'OrderItem', itemId, { status: orderItem.status }, { status }, req);

    // Notify clients
    io.emit('orderItem:statusChanged', { 
      itemId, 
      status, 
      orderId: orderItem.orderId,
      tableId: orderItem.order.tableId 
    });

    res.json(updatedItem);
  } catch (error) {
    logger.error('Update order item status error:', error);
    res.status(500).json({ error: 'Failed to update item status' });
  }
};

export const addOrderItems = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { items } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot modify paid or cancelled order' });
    }

    // Get menu item details
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true
      }
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'Some menu items are unavailable' });
    }

    // Create new order items
    const newItems = items.map((item: any) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem!.price,
        totalPrice: menuItem!.price.toNumber() * item.quantity,
        notes: item.notes
      };
    });

    // Calculate new totals
    const allItems = [...order.items, ...newItems];
    const { taxAmount, totalAmount } = calculateOrderTotals(allItems);

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        taxAmount,
        totalAmount,
        items: {
          create: newItems
        }
      },
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

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId, 'ADD_ITEMS', 'Order', id, undefined, { itemsAdded: newItems.length }, req);

    // Notify kitchen
    io.emit('order:itemsAdded', { orderId: id, items: newItems });

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Add order items error:', error);
    res.status(500).json({ error: 'Failed to add items' });
  }
};

export const removeOrderItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    });

    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    if (orderItem.order.status === 'PAID' || orderItem.order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot modify paid or cancelled order' });
    }

    // Remove item
    await prisma.orderItem.delete({ where: { id: itemId } });

    // Recalculate totals
    const remainingItems = orderItem.order.items
    .filter(i => i.id !== itemId)
    .map(i => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice.toNumber()
     }));

const { taxAmount, totalAmount } = calculateOrderTotals(remainingItems);

    const updatedOrder = await prisma.order.update({
      where: { id: orderItem.orderId },
      data: {
        taxAmount,
        totalAmount
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId, 'REMOVE_ITEM', 'Order', orderItem.orderId, undefined, { itemId }, req);

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Remove order item error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
};

export const requestBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already paid or cancelled' });
    }

    // Update order status to READY (ready for payment)
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

    await redis.del('orders:active');
    await createAuditLog(req.user?.userId || 'customer', 'REQUEST_BILL', 'Order', id, undefined, undefined, req);

    // Notify waiters
    io.emit('order:billRequested', { 
      orderId: id, 
      tableId: order.tableId,
      tableNumber: order.table.number 
    });

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Request bill error:', error);
    res.status(500).json({ error: 'Failed to request bill' });
  }
};




export const getCurrentCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const session = await prisma.qRSession.findUnique({
      where: { token },
      include: {
        table: true
      }
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired QR session' });
    }

    const order = await prisma.order.findFirst({
      where: {
        qrSessionId: session.id,
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
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

    res.json({
      session: {
        sessionId: session.id,
        tableId: session.tableId,
        tableNumber: session.table.number,
        tableName: session.table.name
      },
      order: order || null
    });
  } catch (error) {
    logger.error('Get current customer order error:', error);
    res.status(500).json({ error: 'Failed to get current customer order' });
  }
};

export const addCustomerOrderItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { qrSessionToken, items } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        qrSession: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!qrSessionToken || !order.qrSession || order.qrSession.token !== qrSessionToken) {
      return res.status(401).json({ error: 'Unauthorized for this order' });
    }

    if (!order.qrSession.isActive || order.qrSession.expiresAt < new Date()) {
      return res.status(401).json({ error: 'QR session expired' });
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot modify paid or cancelled order' });
    }

    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true
      }
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'Some menu items are unavailable' });
    }

    const newItems = items.map((item: any) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem!.price,
        totalPrice: menuItem!.price.toNumber() * item.quantity,
        notes: item.notes
      };
    });

    const allItems = [
      ...order.items.map(i => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice.toNumber()
      })),
      ...newItems.map(i => ({
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice)
      }))
    ];

    const { taxAmount, totalAmount } = calculateOrderTotals(allItems);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        taxAmount,
        totalAmount,
        items: {
          create: newItems
        }
      },
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

    await redis.del('orders:active');

    io.emit('order:itemsAdded', { orderId: id, items: newItems });
    io.to(`table:${order.tableId}`).emit('order:updated', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Add customer order items error:', error);
    res.status(500).json({ error: 'Failed to add items' });
  }
};

export const requestCustomerBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { qrSessionToken } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        qrSession: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!qrSessionToken || !order.qrSession || order.qrSession.token !== qrSessionToken) {
      return res.status(401).json({ error: 'Unauthorized for this order' });
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already paid or cancelled' });
    }

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

    await redis.del('orders:active');

    io.emit('order:billRequested', {
      orderId: id,
      tableId: order.tableId,
      tableNumber: order.table.number
    });

    res.json(updatedOrder);
  } catch (error) {
    logger.error('Request customer bill error:', error);
    res.status(500).json({ error: 'Failed to request bill' });
  }
};

