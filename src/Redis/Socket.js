const { Server } = require("socket.io");
require('dotenv').config();

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL ||
        "http://localhost:5173",
      ],
      methods: ["GET", "POST" ,"PUT","DELETE"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };