import "dotenv/config"
import { RedisService } from './services/redis';
import { CleanupJob } from './jobs/cleanup';
import {connectRabbitMQ} from "./config/rabbit/rabbit";
import {startConsumer} from "./config/rabbit/consumer";
import { DatabaseConfig } from './config/db/mongo';

async function main() {
  console.log('Starting Redis Cleanup Job Service...');

  try {
    // Initialize Redis connection
    const redisService = RedisService.getInstance();
    await redisService.connect();

    const db = DatabaseConfig.getInstance();
    await db.connectMongoDB();

    console.log('Redis connected successfully');

    // Initialize RabbitMQ connection
    await connectRabbitMQ();
    await startConsumer();
   
    // Initialize and start cleanup job
    const cleanupJob = new CleanupJob(redisService);
    cleanupJob.start();
    console.log('Cleanup job scheduled');

    console.log('Service is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const redisService = RedisService.getInstance();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const redisService = RedisService.getInstance();
  await redisService.disconnect();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();
