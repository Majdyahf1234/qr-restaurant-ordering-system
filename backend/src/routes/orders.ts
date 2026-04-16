import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  addOrderItems,
  removeOrderItem,
  requestBill,
  getOrdersByTable,
  getActiveOrders,
  getCurrentCustomerOrder,
  addCustomerOrderItems,
  requestCustomerBill
} from '../controllers/orderController';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authenticate, [
  query('status').optional(),
  query('tableId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
], getOrders);



router.get('/customer/current/:token', getCurrentCustomerOrder);

router.post('/customer/:id/items', [
  param('id').isUUID(),
  body('qrSessionToken').isString().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.menuItemId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 })
], addCustomerOrderItems);

router.post('/customer/:id/bill', [
  param('id').isUUID(),
  body('qrSessionToken').isString().notEmpty()
], requestCustomerBill);



/**
 * @swagger
 * /orders/active:
 *   get:
 *     summary: Get active orders (not paid/cancelled)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active orders
 */
router.get('/active', authenticate, getActiveOrders);

/**
 * @swagger
 * /orders/table/{tableId}:
 *   get:
 *     summary: Get orders by table
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of orders for table
 */
router.get('/table/:tableId', authenticate, param('tableId').isUUID(), getOrdersByTable);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
router.get('/:id', authenticate, param('id').isUUID(), getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableId
 *               - items
 *             properties:
 *               tableId:
 *                 type: string
 *               qrSessionToken:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     notes:
 *                       type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', [
  body('tableId').isUUID().withMessage('Valid table ID is required'),
  body('qrSessionToken').optional().isString(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItemId').isUUID().withMessage('Valid menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.notes').optional().trim(),
  body('notes').optional().trim()
], createOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, READY, SERVED, PAID, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, authorize(UserRole.WAITER, UserRole.KITCHEN, UserRole.ADMIN), [
  param('id').isUUID(),
  body('status').isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'])
], updateOrderStatus);

/**
 * @swagger
 * /orders/items/{itemId}/status:
 *   patch:
 *     summary: Update order item status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PREPARING, READY, SERVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Item status updated
 */
router.patch('/items/:itemId/status', authenticate, authorize(UserRole.WAITER, UserRole.KITCHEN, UserRole.ADMIN), [
  param('itemId').isUUID(),
  body('status').isIn(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'])
], updateOrderItemStatus);

/**
 * @swagger
 * /orders/{id}/items:
 *   post:
 *     summary: Add items to existing order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Items added
 */
router.post('/:id/items', authenticate, authorize(UserRole.WAITER, UserRole.ADMIN), [
  param('id').isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.menuItemId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 })
], addOrderItems);

/**
 * @swagger
 * /orders/items/{itemId}:
 *   delete:
 *     summary: Remove item from order
 *     tags: [Orders]
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
 *         description: Item removed
 */
router.delete('/items/:itemId', authenticate, authorize(UserRole.WAITER, UserRole.ADMIN), [
  param('itemId').isUUID()
], removeOrderItem);

/**
 * @swagger
 * /orders/{id}/bill:
 *   post:
 *     summary: Request bill for order
 *     tags: [Orders]
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
 *         description: Bill requested
 */
router.post('/:id/bill', authenticate, requestBill);

export default router;
