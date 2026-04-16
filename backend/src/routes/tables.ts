import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  getTableSessions,
  closeTable
} from '../controllers/tableController';

const router = Router();

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 */
router.get('/', authenticate, getTables);

/**
 * @swagger
 * /tables/{id}:
 *   get:
 *     summary: Get table by ID
 *     tags: [Tables]
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
 *         description: Table details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 */
router.get('/:id', authenticate, param('id').isUUID(), getTableById);

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create new table
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *             properties:
 *               number:
 *                 type: integer
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Table created
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.RECEPTION), [
  body('number').isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
  body('name').optional().trim(),
  body('capacity').optional().isInt({ min: 1 })
], createTable);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table
 *     tags: [Tables]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: integer
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Table updated
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.RECEPTION), [
  param('id').isUUID(),
  body('number').optional().isInt({ min: 1 }),
  body('name').optional().trim(),
  body('capacity').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean()
], updateTable);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete table
 *     tags: [Tables]
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
 *         description: Table deleted
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID()
], deleteTable);

/**
 * @swagger
 * /tables/{id}/status:
 *   patch:
 *     summary: Update table status
 *     tags: [Tables]
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
 *                 enum: [FREE, OCCUPIED, RESERVED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, authorize(UserRole.RECEPTION, UserRole.WAITER, UserRole.ADMIN), [
  param('id').isUUID(),
  body('status').isIn(['FREE', 'OCCUPIED', 'RESERVED']).withMessage('Invalid status')
], updateTableStatus);

/**
 * @swagger
 * /tables/{id}/sessions:
 *   get:
 *     summary: Get table QR sessions
 *     tags: [Tables]
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
 *         description: List of QR sessions
 */
router.get('/:id/sessions', authenticate, param('id').isUUID(), getTableSessions);

/**
 * @swagger
 * /tables/{id}/close:
 *   post:
 *     summary: Close table and deactivate QR
 *     tags: [Tables]
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
 *         description: Table closed
 */
router.post('/:id/close', authenticate, authorize(UserRole.RECEPTION, UserRole.WAITER, UserRole.ADMIN), [
  param('id').isUUID()
], closeTable);

export default router;
