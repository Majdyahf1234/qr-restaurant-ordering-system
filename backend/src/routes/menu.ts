import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemAvailability,
  reorderCategories,
  reorderMenuItems
} from '../controllers/menuController';

const router = Router();

// Public routes (for customer menu viewing)
router.get('/categories', getCategories);
router.get('/categories/:id', param('id').isUUID(), getCategoryById);
router.get('/items', getMenuItems);
router.get('/items/:id', param('id').isUUID(), getMenuItemById);

// Protected routes (admin only)
router.post('/categories', authenticate, authorize(UserRole.ADMIN), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
  body('sortOrder').optional().isInt()
], createCategory);

router.put('/categories/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('sortOrder').optional().isInt()
], updateCategory);

router.delete('/categories/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID()
], deleteCategory);

router.post('/categories/reorder', authenticate, authorize(UserRole.ADMIN), [
  body('categoryIds').isArray().withMessage('categoryIds must be an array')
], reorderCategories);

// Menu items protected routes
router.post('/items', authenticate, authorize(UserRole.ADMIN), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().trim(),
  body('isAvailable').optional().isBoolean(),
  body('isPublic').optional().isBoolean(),
  body('sortOrder').optional().isInt()
], createMenuItem);

router.put('/items/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('categoryId').optional().isUUID(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('isAvailable').optional().isBoolean(),
  body('isPublic').optional().isBoolean(),
  body('sortOrder').optional().isInt()
], updateMenuItem);

router.delete('/items/:id', authenticate, authorize(UserRole.ADMIN), [
  param('id').isUUID()
], deleteMenuItem);

router.patch('/items/:id/availability', authenticate, authorize(UserRole.ADMIN, UserRole.KITCHEN), [
  param('id').isUUID(),
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
], updateMenuItemAvailability);

router.post('/items/reorder', authenticate, authorize(UserRole.ADMIN), [
  body('itemIds').isArray().withMessage('itemIds must be an array')
], reorderMenuItems);

export default router;
