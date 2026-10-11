import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socketManager.js';
import { startHeartbeatWatchdog } from './services/heartbeatWatchdog.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Create HTTP & Socket.IO server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    initSocket(io);

    // 3. Start Heartbeat Watchdog
    startHeartbeatWatchdog();

    // 4. Listen on port
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 SafeRide Tactical Emergency Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️ Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ Socket.IO Ready for Hardware & Operator Streams`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown
    const handleShutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP and Socket server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err) {
    console.error(`[Server] Critical failure during startup: ${err.message}`);
    process.exit(1);
  }
};

startServer();
