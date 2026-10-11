import express from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
} from '../controllers/deviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getDevices);
router.get('/:id', protect, getDeviceById);
router.post('/', protect, authorize('SUPER_ADMIN'), createDevice);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateDevice);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteDevice);

export default router;
