import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getKitchenOrders,
  getOrderDetails,
  markItemPreparing,
  markItemReady,
  markOrderReady,
  getKitchenStats
} from '../controllers/kitchenController';

const router = Router();

/**
 * @swagger
 * /kitchen/orders:
 *   get:
 *     summary: Get orders for kitchen display
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN, UserRole.WAITER), getKitchenOrders);

/**
 * @swagger
 * /kitchen/orders/{id}:
 *   get:
 *     summary: Get order details for kitchen
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/orders/:id', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN, UserRole.WAITER), [
  param('id').isUUID()
], getOrderDetails);

/**
 * @swagger
 * /kitchen/items/{itemId}/preparing:
 *   post:
 *     summary: Mark order item as preparing
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item marked as preparing
 */
router.post('/items/:itemId/preparing', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN), [
  param('itemId').isUUID()
], markItemPreparing);

/**
 * @swagger
 * /kitchen/items/{itemId}/ready:
 *   post:
 *     summary: Mark order item as ready
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item marked as ready
 */
router.post('/items/:itemId/ready', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN), [
  param('itemId').isUUID()
], markItemReady);

/**
 * @swagger
 * /kitchen/orders/{id}/ready:
 *   post:
 *     summary: Mark entire order as ready
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order marked as ready
 */
router.post('/orders/:id/ready', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN), [
  param('id').isUUID()
], markOrderReady);

/**
 * @swagger
 * /kitchen/stats:
 *   get:
 *     summary: Get kitchen statistics
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kitchen stats
 */
router.get('/stats', authenticate, authorize(UserRole.KITCHEN, UserRole.ADMIN), getKitchenStats);

export default router;
