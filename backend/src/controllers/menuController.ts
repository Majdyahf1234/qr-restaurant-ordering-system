import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';

const CACHE_TTL = 300; // 5 minutes

// Categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'menu:categories';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isAvailable: true, isPublic: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            sortOrder: true
          }
        }
      }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(categories));
    res.json(categories);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    logger.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        sortOrder: sortOrder || 0
      }
    });

    await redis.del('menu:categories');
    await createAuditLog(req.user?.userId, 'CREATE', 'Category', category.id, undefined, category, req);

    res.status(201).json(category);
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    const oldCategory = await prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        sortOrder,
        isActive
      }
    });

    await redis.del('menu:categories');
    await createAuditLog(req.user?.userId, 'UPDATE', 'Category', id, oldCategory, category, req);

    res.json(category);
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await prisma.category.delete({ where: { id } });

    await redis.del('menu:categories');
    await createAuditLog(req.user?.userId, 'DELETE', 'Category', id, category, undefined, req);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const { categoryIds } = req.body;

    await prisma.$transaction(
      categoryIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    );

    await redis.del('menu:categories');

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    logger.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
};

// Menu Items
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { categoryId, includeUnavailable, includePrivate } = req.query;
    
    const cacheKey = `menu:items:${categoryId || 'all'}:${includeUnavailable || 'false'}:${includePrivate || 'false'}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (!includeUnavailable || includeUnavailable === 'false') {
      where.isAvailable = true;
    }
    
    if (!includePrivate || includePrivate === 'false') {
      where.isPublic = true;
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(items));
    res.json(items);
  } catch (error) {
    logger.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to get menu items' });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(item);
  } catch (error) {
    logger.error('Get menu item error:', error);
    res.status(500).json({ error: 'Failed to get menu item' });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, categoryId, imageUrl, isAvailable, isPublic, sortOrder } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        isAvailable: isAvailable ?? true,
        isPublic: isPublic ?? true,
        sortOrder: sortOrder || 0
      }
    });

    await redis.del('menu:categories');
    await redis.keys('menu:items:*').then(keys => keys.forEach(key => redis.del(key)));
    
    await createAuditLog(req.user?.userId, 'CREATE', 'MenuItem', item.id, undefined, item, req);

    res.status(201).json(item);
  } catch (error) {
    logger.error('Create menu item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, price, categoryId, imageUrl, isAvailable, isPublic, sortOrder } = req.body;

    const oldItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!oldItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        isAvailable,
        isPublic,
        sortOrder
      }
    });

    await redis.del('menu:categories');
    await redis.keys('menu:items:*').then(keys => keys.forEach(key => redis.del(key)));
    
    await createAuditLog(req.user?.userId, 'UPDATE', 'MenuItem', id, oldItem, item, req);

    res.json(item);
  } catch (error) {
    logger.error('Update menu item error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({ where: { id } });

    await redis.del('menu:categories');
    await redis.keys('menu:items:*').then(keys => keys.forEach(key => redis.del(key)));
    
    await createAuditLog(req.user?.userId, 'DELETE', 'MenuItem', id, item, undefined, req);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    logger.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

export const updateMenuItemAvailability = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { isAvailable } = req.body;

    const oldItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!oldItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable }
    });

    await redis.del('menu:categories');
    await redis.keys('menu:items:*').then(keys => keys.forEach(key => redis.del(key)));
    
    await createAuditLog(req.user?.userId, 'UPDATE_AVAILABILITY', 'MenuItem', id, { isAvailable: oldItem.isAvailable }, { isAvailable }, req);

    res.json(item);
  } catch (error) {
    logger.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

export const reorderMenuItems = async (req: Request, res: Response) => {
  try {
    const { itemIds } = req.body;

    await prisma.$transaction(
      itemIds.map((id: string, index: number) =>
        prisma.menuItem.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    );

    await redis.del('menu:categories');
    await redis.keys('menu:items:*').then(keys => keys.forEach(key => redis.del(key)));

    res.json({ message: 'Menu items reordered successfully' });
  } catch (error) {
    logger.error('Reorder items error:', error);
    res.status(500).json({ error: 'Failed to reorder items' });
  }
};
