const { createClient } = require('redis')
require('dotenv').config()

const redisClient = createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', err => {
  console.error('Redis Error:', err)
})

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('✅ Redis Cloud connected')
  }
}

module.exports = { redisClient, connectRedis }
