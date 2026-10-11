import express from 'express';
import {
  receiveHeartbeat,
  updateLocation,
  updateBattery,
  updateTamper,
  updateGatewayStatus,
  getRecentTelemetry,
} from '../controllers/telemetryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Hardware Gateway / Simulator Telemetry endpoints
router.post('/heartbeat', receiveHeartbeat);
router.post('/location', updateLocation);
router.post('/battery', updateBattery);
router.post('/tamper', updateTamper);
router.post('/gateway-status', updateGatewayStatus);

// Tactical stream logs
router.get('/recent', protect, getRecentTelemetry);

export default router;
