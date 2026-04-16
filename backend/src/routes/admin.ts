import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getSettings,
  updateSettings,
  getAuditLogs,
  getDashboardStats,
  getRestaurantInfo,
  updateRestaurantInfo
} from '../controllers/adminController';

const router = Router();

// User management (Admin only)
router.get('/users', authenticate, authorize(UserRole.ADMIN), getUsers);
router.get('/users/:id', authenticate, authorize(UserRole.ADMIN), param('id').isUUID(), getUserById);
router.post('/users', authenticate, authorize(UserRole.ADMIN), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['ADMIN', 'RECEPTION', 'WAITER', 'KITCHEN'])
], createUser);
router.put('/users/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID(),
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['ADMIN', 'RECEPTION', 'WAITER', 'KITCHEN'])
], updateUser);
router.delete('/users/:id', authenticate, authorize(UserRole.ADMIN), param('id').isUUID(), deleteUser);
router.patch('/users/:id/status', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID(),
  body('isActive').isBoolean()
], updateUserStatus);

// Settings
router.get('/settings', authenticate, authorize(UserRole.ADMIN), getSettings);
router.put('/settings', authenticate, authorize(UserRole.ADMIN), [
  body('settings').isArray()
], updateSettings);

// Audit logs
router.get('/audit-logs', authenticate, authorize(UserRole.ADMIN), getAuditLogs);

// Dashboard stats
router.get('/dashboard', authenticate, authorize(UserRole.ADMIN, UserRole.RECEPTION), getDashboardStats);

// Restaurant info
router.get('/restaurant-info', getRestaurantInfo);
router.put('/restaurant-info', authenticate, authorize(UserRole.ADMIN), [
  body('name').optional().trim(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail(),
  body('website').optional().trim(),
  body('openingHours').optional()
], updateRestaurantInfo);

export default router;
