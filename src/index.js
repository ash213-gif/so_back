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
app.use(cors());
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
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://myapp.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

initSocket(server);

// Listen with HTTP server (NOT app.listen)
server.listen(Port, async () => {
  await connectRedis();
  console.log(`🚀 Server flying on port ${Port}`);
});
