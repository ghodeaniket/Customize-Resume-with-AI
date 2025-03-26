// test-redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis');
  process.exit(0);
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

// Try a simple operation
redis.set('test-key', 'test-value', (err, result) => {
  if (err) {
    console.error('Error setting key:', err);
  } else {
    console.log('Key set successfully:', result);
  }
});
