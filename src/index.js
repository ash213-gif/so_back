require('dotenv').config();
const express = require('express');
const routes = require('./Routes/userRoutes');
const mongoose = require('mongoose');
const { connectRedis } = require('./Redis/Redis');
const http = require('http'); 
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const { initSocket } = require('./Redis/Socket');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const Port = 3030;

// DB
mongoose.connect(process.env.MongoUrl)
  .then(() => console.log('mongoose connected'))
  .catch((err) => console.log(err));
  
  // Create HTTP server from Express app
  const server = http.createServer(app);

// Routes


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

initSocket(server);

server.listen(Port, async () => {
  await connectRedis();
  console.log(`🚀 Server flying on port ${Port}`);
});
