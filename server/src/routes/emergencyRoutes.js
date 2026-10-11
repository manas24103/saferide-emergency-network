import express from 'express';
import {
  createEmergency,
  getEmergencies,
  getActiveEmergencies,
  getEmergencyById,
  acknowledgeEmergency,
  markResponding,
  resolveEmergency,
} from '../controllers/emergencyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Hardware ESP32 / Gateway / Simulator endpoint (can be called without JWT or with JWT)
router.post('/', createEmergency);

// Protected Operator / Admin endpoints
router.get('/', protect, getEmergencies);
router.get('/active', protect, getActiveEmergencies);
router.get('/:id', protect, getEmergencyById);
router.put('/:id/acknowledge', protect, authorize('SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR'), acknowledgeEmergency);
router.put('/:id/respond', protect, authorize('SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR'), markResponding);
router.put('/:id/resolve', protect, authorize('SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR'), resolveEmergency);

export default router;
