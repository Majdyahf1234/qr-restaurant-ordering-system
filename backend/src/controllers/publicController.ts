import { Request, Response } from 'express';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';

const CACHE_TTL = 600; // 10 minutes for public content

export const getRestaurantInfo = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'public:restaurant-info';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const info = await prisma.restaurantInfo.findFirst();
    
    const data = info || {
      name: process.env.RESTAURANT_NAME || 'Your Restaurant',
      address: process.env.RESTAURANT_ADDRESS || '',
      phone: process.env.RESTAURANT_PHONE || '',
      email: process.env.RESTAURANT_EMAIL || '',
      website: process.env.RESTAURANT_WEBSITE || '',
      openingHours: {
        monday: '9:00 AM - 10:00 PM',
        tuesday: '9:00 AM - 10:00 PM',
        wednesday: '9:00 AM - 10:00 PM',
        thursday: '9:00 AM - 10:00 PM',
        friday: '9:00 AM - 11:00 PM',
        saturday: '9:00 AM - 11:00 PM',
        sunday: '10:00 AM - 9:00 PM'
      }
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    res.json(data);
  } catch (error) {
    logger.error('Get restaurant info error:', error);
    res.status(500).json({ error: 'Failed to get restaurant info' });
  }
};

export const getPublicMenu = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'public:menu';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { 
            isAvailable: true, 
            isPublic: true 
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            // Price is intentionally excluded for public menu
          }
        }
      }
    });

    // Filter out categories with no items
    const filteredCategories = categories.filter(cat => cat.items.length > 0);

    const data = {
      categories: filteredCategories,
      lastUpdated: new Date().toISOString()
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    res.json(data);
  } catch (error) {
    logger.error('Get public menu error:', error);
    res.status(500).json({ error: 'Failed to get menu' });
  }
};

export const getPublicCategories = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'public:categories';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        items: {
          where: { 
            isAvailable: true, 
            isPublic: true 
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true
          }
        }
      }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(categories));
    res.json(categories);
  } catch (error) {
    logger.error('Get public categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};
