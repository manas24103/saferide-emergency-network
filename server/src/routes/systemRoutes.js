import express from 'express';
import {
  getHealth,
  getSystemStats,
  getSettings,
  updateSettings,
} from '../controllers/systemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public health check
router.get('/health', getHealth);

// Authenticated stats
router.get('/stats', protect, getSystemStats);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, authorize('SUPER_ADMIN'), updateSettings);

export default router;
