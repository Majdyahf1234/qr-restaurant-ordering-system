import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, isActive, search } = req.query;
    
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role } = req.body;

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await createAuditLog(req.user?.userId, 'CREATE', 'User', user.id, undefined, { email, name, role }, req);

    res.status(201).json(user);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, name, role, password } = req.body;

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if changing
    if (email && email !== oldUser.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData: any = { email, name, role };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    await createAuditLog(req.user?.userId, 'UPDATE', 'User', id, oldUser, user, req);

    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (id === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog(req.user?.userId, 'DELETE', 'User', id, user, undefined, req);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating yourself
    if (id === req.user?.userId && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    await createAuditLog(req.user?.userId, 'UPDATE_STATUS', 'User', id, { isActive: oldUser.isActive }, { isActive }, req);

    res.json(user);
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });

    res.json(settings);
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;

    const updatedSettings = await prisma.$transaction(
      settings.map((setting: any) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description
          }
        })
      )
    );

    await createAuditLog(req.user?.userId, 'UPDATE', 'Settings', undefined, undefined, settings, req);

    res.json(updatedSettings);
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, entityType, action, from, to, page = '1', limit = '50' } = req.query;
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (action) {
      where.action = action;
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
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get various stats
    const [
      totalTables,
      occupiedTables,
      todayOrders,
      todayRevenue,
      yesterdayOrders,
      yesterdayRevenue,
      weekOrders,
      weekRevenue,
      monthOrders,
      monthRevenue,
      activeOrders,
      pendingOrders,
      menuItemsCount,
      staffCount
    ] = await Promise.all([
      prisma.table.count({ where: { isActive: true } }),
      prisma.table.count({ where: { isActive: true, status: 'OCCUPIED' } }),
      
      // Today
      prisma.order.count({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // Yesterday
      prisma.order.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // This week
      prisma.order.count({
        where: {
          createdAt: { gte: thisWeekStart },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thisWeekStart },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // This month
      prisma.order.count({
        where: {
          createdAt: { gte: thisMonthStart },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thisMonthStart },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // Active orders
      prisma.order.count({
        where: {
          status: { notIn: ['PAID', 'CANCELLED'] }
        }
      }),
      
      prisma.order.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      prisma.menuItem.count({ where: { isAvailable: true } }),
      prisma.user.count({ where: { isActive: true } })
    ]);

    // Get top selling items today
    const topItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' }
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const topItemsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { name: true }
        });
        return {
          name: menuItem?.name,
          quantity: item._sum.quantity
        };
      })
    );

    res.json({
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        free: totalTables - occupiedTables
      },
      orders: {
        today: todayOrders,
        yesterday: yesterdayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
        active: activeOrders,
        pending: pendingOrders
      },
      revenue: {
        today: todayRevenue._sum.totalAmount || 0,
        yesterday: yesterdayRevenue._sum.totalAmount || 0,
        thisWeek: weekRevenue._sum.totalAmount || 0,
        thisMonth: monthRevenue._sum.totalAmount || 0
      },
      topItems: topItemsWithDetails,
      counts: {
        menuItems: menuItemsCount,
        staff: staffCount
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

export const getRestaurantInfo = async (req: Request, res: Response) => {
  try {
    const info = await prisma.restaurantInfo.findFirst();
    
    if (!info) {
      return res.json({
        name: process.env.RESTAURANT_NAME || 'Your Restaurant',
        address: process.env.RESTAURANT_ADDRESS || '',
        phone: process.env.RESTAURANT_PHONE || '',
        email: process.env.RESTAURANT_EMAIL || ''
      });
    }

    res.json(info);
  } catch (error) {
    logger.error('Get restaurant info error:', error);
    res.status(500).json({ error: 'Failed to get restaurant info' });
  }
};

export const updateRestaurantInfo = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, phone, email, website, openingHours, logoUrl } = req.body;

    const existing = await prisma.restaurantInfo.findFirst();
    
    let info;
    if (existing) {
      info = await prisma.restaurantInfo.update({
        where: { id: existing.id },
        data: {
          name,
          address,
          phone,
          email,
          website,
          openingHours,
          logoUrl
        }
      });
    } else {
      info = await prisma.restaurantInfo.create({
        data: {
          name,
          address,
          phone,
          email,
          website,
          openingHours,
          logoUrl
        }
      });
    }

    await createAuditLog(req.user?.userId, 'UPDATE', 'RestaurantInfo', info.id, existing, info, req);

    res.json(info);
  } catch (error) {
    logger.error('Update restaurant info error:', error);
    res.status(500).json({ error: 'Failed to update restaurant info' });
  }
};
