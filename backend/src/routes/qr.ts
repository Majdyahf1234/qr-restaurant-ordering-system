import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  generateQRCode,
  validateQRSession,
  getQRSessionInfo,
  printQRCode,
  deactivateQRSession
} from '../controllers/qrController';

const router = Router();

/**
 * @swagger
 * /qr/generate/{tableId}:
 *   post:
 *     summary: Generate QR code for table
 *     tags: [QR Codes]
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
 *         description: QR code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                 token:
 *                   type: string
 *                 session:
 *                   $ref: '#/components/schemas/QRSession'
 */
router.post('/generate/:tableId', authenticate, authorize(UserRole.RECEPTION, UserRole.ADMIN), [
  param('tableId').isUUID()
], generateQRCode);

/**
 * @swagger
 * /qr/validate:
 *   post:
 *     summary: Validate QR session token
 *     tags: [QR Codes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session is valid
 *       401:
 *         description: Invalid or expired session
 */
router.post('/validate', [
  body('token').notEmpty().withMessage('Token is required')
], validateQRSession);

/**
 * @swagger
 * /qr/session/{token}:
 *   get:
 *     summary: Get QR session information
 *     tags: [QR Codes]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session information
 */
router.get('/session/:token', getQRSessionInfo);

/**
 * @swagger
 * /qr/print/{tableId}:
 *   post:
 *     summary: Print QR code for table
 *     tags: [QR Codes]
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
 *         description: QR code sent to printer
 */
router.post('/print/:tableId', authenticate, authorize(UserRole.RECEPTION, UserRole.ADMIN), [
  param('tableId').isUUID()
], printQRCode);

/**
 * @swagger
 * /qr/deactivate/{sessionId}:
 *   post:
 *     summary: Deactivate QR session
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session deactivated
 */
router.post('/deactivate/:sessionId', authenticate, authorize(UserRole.RECEPTION, UserRole.WAITER, UserRole.ADMIN), [
  param('sessionId').isUUID()
], deactivateQRSession);

export default router;
