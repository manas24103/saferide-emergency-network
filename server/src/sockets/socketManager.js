let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Tactical client connected: ${socket.id}`);

    // Join room based on role or vehicle
    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Tactical client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (!ioInstance) {
    console.warn('[Socket.IO] Warning: ioInstance not initialized yet.');
  }
  return ioInstance;
};

export const emitEvent = (eventName, data) => {
  if (ioInstance) {
    ioInstance.emit(eventName, data);
  }
};
