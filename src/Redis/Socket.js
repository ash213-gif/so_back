const { Server } = require('socket.io');

let io; 

const initSocket = (server) => {
  if (io) return io; // Already initialized

  io = new Server(server, {
    cors: {
      origin:process.env.FRONTEND_URL  || "http://localhost:5173" ,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('user connected:', socket.id); // Fixed syntax

    socket.on('msg', (msg) => {
      io.emit('msg', msg);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
