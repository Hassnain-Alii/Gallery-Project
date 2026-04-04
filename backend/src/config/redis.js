const { Redis } = require('ioredis');

// Robust Redis config for Vercel
const redisOptions = {
  connectTimeout: 5000,       // 5s to connect
  commandTimeout: 2000,       // 2s per command (fail fast)
  maxRetriesPerRequest: 1,    // Don't keep retrying forever if command fails
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 times
    return Math.min(times * 100, 2000);
  }
};

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

redisClient.on('error', (err) => console.error('Redis error:', err.message));
redisClient.on('connect', () => console.log('Redis connected successfully'));

module.exports = redisClient;
