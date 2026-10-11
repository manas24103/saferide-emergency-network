import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getVehicles);
router.get('/:id', protect, getVehicleById);
router.post('/', protect, authorize('SUPER_ADMIN'), createVehicle);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateVehicle);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteVehicle);

export default router;
