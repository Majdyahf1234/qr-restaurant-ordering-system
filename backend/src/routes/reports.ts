import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getSalesReport,
  getItemReport,
  getTableReport,
  getWaiterReport,
  exportReportCSV,
  exportReportPDF
} from '../controllers/reportController';

const router = Router();

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Get sales report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Sales report data
 */
router.get('/sales', authenticate, authorize(UserRole.ADMIN), [
  query('from').isISO8601(),
  query('to').isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
], getSalesReport);

/**
 * @swagger
 * /reports/items:
 *   get:
 *     summary: Get item sales report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Item sales report
 */
router.get('/items', authenticate, authorize(UserRole.ADMIN), [
  query('from').isISO8601(),
  query('to').isISO8601()
], getItemReport);

/**
 * @swagger
 * /reports/tables:
 *   get:
 *     summary: Get table usage report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Table usage report
 */
router.get('/tables', authenticate, authorize(UserRole.ADMIN), [
  query('from').isISO8601(),
  query('to').isISO8601()
], getTableReport);

/**
 * @swagger
 * /reports/waiters:
 *   get:
 *     summary: Get waiter performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Waiter performance report
 */
router.get('/waiters', authenticate, authorize(UserRole.ADMIN), [
  query('from').isISO8601(),
  query('to').isISO8601()
], getWaiterReport);

/**
 * @swagger
 * /reports/export/csv:
 *   get:
 *     summary: Export report as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, items, tables, waiters]
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/export/csv', authenticate, authorize(UserRole.ADMIN), [
  query('type').isIn(['sales', 'items', 'tables', 'waiters']),
  query('from').isISO8601(),
  query('to').isISO8601()
], exportReportCSV);

/**
 * @swagger
 * /reports/export/pdf:
 *   get:
 *     summary: Export report as PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, items, tables, waiters]
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PDF file
 */
router.get('/export/pdf', authenticate, authorize(UserRole.ADMIN), [
  query('type').isIn(['sales', 'items', 'tables', 'waiters']),
  query('from').isISO8601(),
  query('to').isISO8601()
], exportReportPDF);

export default router;
