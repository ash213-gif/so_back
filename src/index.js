require('dotenv').config();
const express = require('express');
const routes = require('./Routes/userRoutes');
const mongoose = require('mongoose');
const { connectRedis } = require('./Redis/Redis');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./Redis/Socket'); // Adjust path

const app = express();
const Port = 3030;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL ||
     "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use('/', routes);

// DB
mongoose.connect(process.env.MongoUrl)
  .then(() => console.log('mongoose connected'))
  .catch((err) => console.log(err));

// HTTP server
const server = http.createServer(app);

// Init Socket.IO
initSocket(server);

// Listen
server.listen(Port, async () => {
  await connectRedis();
  console.log(`🚀 Server flying on port ${Port}`);
});
