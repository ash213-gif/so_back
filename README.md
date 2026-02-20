# so_back
w to implement Redis cache in Node.js (step‑by‑step)
1. Install Redis and client
Install Redis locally (or use Docker, or Redis Cloud/free tier).
​

In your Node project:

bash
npm install redis
2. Create a Redis client
Example with node-redis v4:

js
// redisClient.js
const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis error", err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = { redisClient, connectRedis };
In your server.js or app.js:

js
const express = require("express");
const { redisClient, connectRedis } = require("./redisClient");

const app = express();

(async () => {
  await connectRedis();
  app.listen(3000, () => console.log("Server running on 3000"));
})();
3. Add caching to a route (e.g., donation stats)
Example Express route using cache‑aside:

js
const express = require("express");
const { redisClient } = require("./redisClient");
const Donation = require("./models/Donation"); // your Mongoose/ORM model

const router = express.Router();

router.get("/campaign/:id/stats", async (req, res) => {
  const campaignId = req.params.id;
  const cacheKey = `campaign:${campaignId}:stats`;

  try {
    // 1. Check cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        fromCache: true,
        data: JSON.parse(cached),
      });
    }

    // 2. Cache miss → query DB
    const stats = await Donation.aggregate([
      { $match: { campaignId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || { totalAmount: 0, count: 0 };

    // 3. Store in Redis with TTL (e.g., 60 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

    return res.json({
      fromCache: false,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
This is very similar to the DigitalOcean Node+Redis caching example and other guides.

4. Optional: middleware cache layer
You can abstract a generic middleware:
​

js
function cache(keyBuilder, ttlSeconds = 60) {
  return async (req, res, next) => {
    const key = keyBuilder(req);
    try {
      const cached = await redisClient.get(key);
      if (!cached) {
        // Monkey-patch res.json to set cache after handler runs
        const originalJson = res.json.bind(res);
        res.json = async (body) => {
          await redisClient.setEx(key, ttlSeconds, JSON.stringify(body));
          return originalJson(body);
        };
        return next();
      }
      return res.json(JSON.parse(cached));
    } catch (err) {
      console.error("Cache error", err);
      return next(); // fail open
    }
  };
}

// Usage:
router.get(
  "/campaign/:id/stats",
  cache((req) => `campaign:${req.params.id}:stats`, 60),
  async (req, res) => {
    // compute stats from DB...
  }
);
Key configuration and best practices
Choose TTL per route: e.g., donation stats 10–60s, campaign list 5–10min, static lookups maybe 1h.

Key naming convention: resource:identifier:field, like user:123:profile or donation:summary:today.

Invalidate when needed:

For mostly-read data, let TTL handle “eventual freshness”.

For critical data that must be instantly updated, either skip caching or explicitly delete related keys on write (e.g., redisClient.del(cacheKey) after a new donation).

If you tell me your current stack (e.g., Express + MongoDB/Postgres for the donation site), I can give you a plug‑and‑play Redis caching module tailored to your project structure and one concrete route (like /donations, /campaigns, or dashboard stats).

