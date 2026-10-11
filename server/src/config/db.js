import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safesos_db';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected to host: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Local MongoDB unreachable at ${uri}: ${err.message}`);
    console.log(`[Database] Initiating embedded MongoMemoryServer fallback for self-contained execution...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] Embedded in-memory MongoDB started successfully at: ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database] In-memory database initialization failed: ${memErr.message}`);
      throw err;
    }
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
