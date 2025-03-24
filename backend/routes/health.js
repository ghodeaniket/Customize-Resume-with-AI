// routes/health.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const redis = require('../utils/redisClient');
const os = require('os');
const config = require('../config/config');

/**
 * Health check endpoint to verify system status
 */
router.get('/', async (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.app.environment,
    services: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' }
    },
    system: {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usedPercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      cpu: {
        load: os.loadavg(),
        cpus: os.cpus().length
      },
      hostname: os.hostname()
    }
  };
  
  // Check database connection
  try {
    await sequelize.authenticate();
    status.services.database = { 
      status: 'ok',
      message: 'Database connection is established',
      host: config.database.host,
      database: config.database.database
    };
  } catch (error) {
    status.services.database = { 
      status: 'error',
      message: `Database connection failed: ${error.message}`,
      host: config.database.host,
      database: config.database.database
    };
    status.status = 'degraded';
  }
  
  // Check Redis connection
  try {
    const redisClient = await redis.getClient();
    await redisClient.ping();
    status.services.redis = { 
      status: 'ok',
      message: 'Redis connection is established',
      host: config.redis.host
    };
  } catch (error) {
    status.services.redis = { 
      status: 'error',
      message: `Redis connection failed: ${error.message}`,
      host: config.redis.host
    };
    status.status = 'degraded';
  }
  
  // Return appropriate status code
  const statusCode = status.status === 'ok' ? 200 : 
                      status.status === 'degraded' ? 200 : 500;
  res.status(statusCode).json(status);
});

/**
 * Detailed health check endpoint with additional information
 * Requires authentication
 */
router.get('/detailed', async (req, res) => {
  // Basic health status
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.app.environment,
    services: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' }
    },
    system: {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usedPercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      cpu: {
        load: os.loadavg(),
        cpus: os.cpus().length,
        model: os.cpus()[0].model,
        speed: os.cpus()[0].speed
      },
      network: {
        interfaces: Object.entries(os.networkInterfaces())
          .reduce((acc, [name, interfaces]) => {
            acc[name] = interfaces.map(i => ({
              address: i.address,
              netmask: i.netmask,
              family: i.family,
              mac: i.mac
            }));
            return acc;
          }, {})
      },
      os: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        hostname: os.hostname()
      }
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      arch: process.arch,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      resourceUsage: process.resourceUsage && process.resourceUsage()
    },
    nodeEnv: process.env.NODE_ENV,
    config: {
      app: config.app,
      redis: {
        host: config.redis.host,
        port: config.redis.port
      },
      database: {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        dialect: config.database.dialect
      },
      jobs: config.jobs
    }
  };
  
  // Check database connection
  try {
    await sequelize.authenticate();
    const dbStats = await sequelize.query(`
      SELECT 
        pg_database_size(current_database()) as db_size,
        (SELECT count(*) FROM "Jobs") as jobs_count,
        (SELECT count(*) FROM "Jobs" WHERE status = 'completed') as completed_jobs,
        (SELECT count(*) FROM "Jobs" WHERE status = 'failed') as failed_jobs,
        (SELECT count(*) FROM "Jobs" WHERE status = 'processing') as processing_jobs
    `, { type: sequelize.QueryTypes.SELECT });
    
    status.services.database = { 
      status: 'ok',
      message: 'Database connection is established',
      host: config.database.host,
      database: config.database.database,
      stats: dbStats[0] || {}
    };
  } catch (error) {
    status.services.database = { 
      status: 'error',
      message: `Database connection failed: ${error.message}`,
      host: config.database.host,
      database: config.database.database
    };
    status.status = 'degraded';
  }
  
  // Check Redis connection
  try {
    const redisClient = await redis.getClient();
    const redisInfo = await redisClient.info();
    const redisStats = {
      memory: await redisClient.info('memory'),
      clients: await redisClient.info('clients')
    };
    
    // Get queue stats
    const queueKeys = await redisClient.keys('bull:*');
    
    status.services.redis = { 
      status: 'ok',
      message: 'Redis connection is established',
      host: config.redis.host,
      stats: {
        queues: queueKeys.length,
        queueNames: queueKeys.map(k => k.split(':')[1]).filter((v, i, a) => a.indexOf(v) === i),
        ...redisStats
      }
    };
  } catch (error) {
    status.services.redis = { 
      status: 'error',
      message: `Redis connection failed: ${error.message}`,
      host: config.redis.host
    };
    status.status = 'degraded';
  }
  
  // Return appropriate status code
  const statusCode = status.status === 'ok' ? 200 : 
                      status.status === 'degraded' ? 200 : 500;
  res.status(statusCode).json(status);
});

module.exports = router;
