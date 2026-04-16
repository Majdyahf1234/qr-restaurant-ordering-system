import { Router } from 'express';
import { getPublicMenu, getRestaurantInfo, getPublicCategories } from '../controllers/publicController';

const router = Router();

/**
 * @swagger
 * /public/restaurant-info:
 *   get:
 *     summary: Get public restaurant information
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Restaurant information
 */
router.get('/restaurant-info', getRestaurantInfo);

/**
 * @swagger
 * /public/menu:
 *   get:
 *     summary: Get public menu (without prices)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Public menu
 */
router.get('/menu', getPublicMenu);

/**
 * @swagger
 * /public/categories:
 *   get:
 *     summary: Get public categories with items
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Categories with items
 */
router.get('/categories', getPublicCategories);

export default router;
