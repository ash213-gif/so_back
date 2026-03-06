const  { createClient } =require ('redis')
require('dotenv').config()

const redisClient = createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', (err) => {
  console.error('Redis Error:', err)
})

async function connectRedis() {
   if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✅ Redis connected");
  } else {
    console.log("⚠️ Redis already connected");
  }
  await redisClient.connect()
  console.log('✅ Redis Cloud Connected')
}

connectRedis()

module.exports = {redisClient ,connectRedis }