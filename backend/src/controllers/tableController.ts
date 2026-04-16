import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';
import { TableStatus } from '@prisma/client';

const CACHE_TTL = 60; // 1 minute for table status

export const getTables = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'tables:all';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const tables = await prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
      include: {
        qrSessions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            token: true,
            createdAt: true,
            expiresAt: true
          }
        },
        orders: {
          where: {
            status: {
              notIn: ['PAID', 'CANCELLED']
            }
          },
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        }
      }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(tables));
    res.json(tables);
  } catch (error) {
    logger.error('Get tables error:', error);
    res.status(500).json({ error: 'Failed to get tables' });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        qrSessions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        orders: {
          where: {
            status: {
              notIn: ['PAID', 'CANCELLED']
            }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    logger.error('Get table error:', error);
    res.status(500).json({ error: 'Failed to get table' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { number, name, capacity } = req.body;

    // Check if table number already exists
    const existing = await prisma.table.findUnique({
      where: { number }
    });

    if (existing) {
      return res.status(400).json({ error: 'Table number already exists' });
    }

    const table = await prisma.table.create({
      data: {
        number,
        name,
        capacity: capacity || 4
      }
    });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'CREATE', 'Table', table.id, undefined, table, req);

    res.status(201).json(table);
  } catch (error) {
    logger.error('Create table error:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { number, name, capacity, isActive } = req.body;

    const oldTable = await prisma.table.findUnique({ where: { id } });
    if (!oldTable) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if new number conflicts with existing table
    if (number && number !== oldTable.number) {
      const existing = await prisma.table.findUnique({
        where: { number }
      });
      if (existing) {
        return res.status(400).json({ error: 'Table number already exists' });
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        number,
        name,
        capacity,
        isActive
      }
    });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'UPDATE', 'Table', id, oldTable, table, req);

    res.json(table);
  } catch (error) {
    logger.error('Update table error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table has active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: id,
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      }
    });

    if (activeOrders > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active orders' });
    }

    await prisma.table.delete({ where: { id } });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'DELETE', 'Table', id, table, undefined, req);

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    logger.error('Delete table error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const oldTable = await prisma.table.findUnique({ where: { id } });
    if (!oldTable) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const table = await prisma.table.update({
      where: { id },
      data: { status: status as TableStatus }
    });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'UPDATE_STATUS', 'Table', id, { status: oldTable.status }, { status }, req);

    res.json(table);
  } catch (error) {
    logger.error('Update table status error:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
};

export const getTableSessions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const sessions = await prisma.qRSession.findMany({
      where: { tableId: id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(sessions);
  } catch (error) {
    logger.error('Get table sessions error:', error);
    res.status(500).json({ error: 'Failed to get table sessions' });
  }
};

export const closeTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        qrSessions: {
          where: { isActive: true }
        }
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Deactivate all active QR sessions
    if (table.qrSessions.length > 0) {
      await prisma.qRSession.updateMany({
        where: { 
          tableId: id,
          isActive: true
        },
        data: { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: req.user?.userId
        }
      });

      // Remove session tokens from Redis
      for (const session of table.qrSessions) {
        await redis.del(`qr:session:${session.token}`);
      }
    }

    // Update all active orders to PAID
    await prisma.order.updateMany({
      where: {
        tableId: id,
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      },
      data: {
        status: 'PAID',
        completedAt: new Date()
      }
    });

    // Update table status
    const updatedTable = await prisma.table.update({
      where: { id },
      data: { status: 'FREE' }
    });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'CLOSE_TABLE', 'Table', id, { status: table.status }, { status: 'FREE' }, req);

    res.json({ 
      message: 'Table closed successfully',
      table: updatedTable
    });
  } catch (error) {
    logger.error('Close table error:', error);
    res.status(500).json({ error: 'Failed to close table' });
  }
};
