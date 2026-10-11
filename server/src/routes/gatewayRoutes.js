import express from 'express';
import {
  getGateways,
  getGatewayById,
  createGateway,
  updateGateway,
  deleteGateway,
} from '../controllers/gatewayController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getGateways);
router.get('/:id', protect, getGatewayById);
router.post('/', protect, authorize('SUPER_ADMIN'), createGateway);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateGateway);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteGateway);

export default router;
