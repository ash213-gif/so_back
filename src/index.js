const express = require('express');
const dotenv = require('dotenv');
const routes = require('./Routes/userRoutes');
dotenv.config();
const mongoose = require('mongoose');
const { connectRedis } = require('./Redis/Redis');
const { Server } = require('socket.io');
const http = require('http'); // ⬅️ add this
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { initSocket } = require('./Redis/Socket');
const Port = 3030;

// DB
mongoose.connect(process.env.MongoUrl)
  .then(() => console.log('mongoose connected'))
  .catch((err) => console.log(err));
  
  // Create HTTP server from Express app
  const server = http.createServer(app);

// Routes
app.use('/', routes);


app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
// app.options(/.*/, cors());

initSocket(server);

// Listen with HTTP server (NOT app.listen)
server.listen(Port, async () => {
  await connectRedis();
  console.log(`🚀 Server flying on port ${Port}`);
});
