const { Redis } = require('ioredis');

// Fallback to localhost if not found in environment
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('error', (err) => console.error('Redis error',   err));
redisClient.on('connect', () => console.log('Redis connected'));

module.exports = redisClient;
