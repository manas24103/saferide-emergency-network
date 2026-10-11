import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import gatewayRoutes from './routes/gatewayRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { getHealth } from './controllers/systemController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Trust reverse proxy headers (Render, Heroku, Cloudflare)
app.set('trust proxy', 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // allow map tiles and socket connections in dev
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, ESP32)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parsers & Loggers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// General API Rate Limiting
app.use('/api', apiLimiter);

// Root & Health Endpoint
app.get('/api/health', getHealth);
app.get('/', (req, res) => {
  res.json({
    project: 'SafeRide Wireless SOS / Emergency Response Network',
    version: 'v2.4-PROTOTYPE',
    status: 'OPERATIONAL',
    docs: '/api/health',
  });
});

// Primary Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system', systemRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
