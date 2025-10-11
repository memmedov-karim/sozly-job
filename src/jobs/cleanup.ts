import * as cron from 'node-cron';
import { RedisService } from '../services/redis';
import { MatchSession, CleanupStats } from '../types';

export class CleanupJob {
  private redis: RedisService;
  private cronJob: cron.ScheduledTask | null = null;
  private readonly cronSchedule: string;
  private readonly sessionPrefix: string;
  private isRunning: boolean = false;
  
  private stats: CleanupStats = {
    totalScanned: 0,
    totalDeleted: 0,
    rejectedDeleted: 0,
    endedDeleted: 0,
    lastCleanup: null,
    errors: 0,
    lastError: null,
  };

  constructor(redisService: RedisService) {
    this.redis = redisService;
    this.cronSchedule = process.env.MATCH_SESSION_CLEANUP_CRON_SCHEDULE || '* * * * * *';
    this.sessionPrefix = process.env.MATCH_SESSION_PREFIX || 'match_session:';
  }

  public start(): void {
    console.log(`📅 Scheduling cleanup job with cron: ${this.cronSchedule}`);
    
    // Validate cron expression
    if (!cron.validate(this.cronSchedule)) {
      throw new Error(`Invalid cron expression: ${this.cronSchedule}`);
    }

    // Schedule the job
    this.cronJob = cron.schedule(this.cronSchedule, async () => {
      await this.executeCleanup();
    });

    console.log('Cleanup job started' + this.cronSchedule);
    
    // Run immediately on start
    this.executeCleanup();
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Cleanup job stopped');
    }
  }

  private async executeCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('Cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    console.log('\n' + '='.repeat(60));
    console.log(`🧹 Starting cleanup cycle at ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    let scanned = 0;
    let deleted = 0;
    let rejectedCount = 0;
    let endedCount = 0;
    let errors = 0;

    try {
      // Get all match session keys
      const pattern = `${this.sessionPrefix}*`;
      const keys = await this.redis.client.keys(pattern);
      
      console.log(`Found ${keys.length} match sessions to scan`);

      if (keys.length === 0) {
        console.log('ℹNo sessions to clean');
        this.isRunning = false;
        return;
      }

      // Process each key
      for (const key of keys) {
        scanned++;
        
        try {
          const sessionData = await this.redis.client.get(key);
          
          if (!sessionData) {
            console.log(`Key ${key} no longer exists, skipping...`);
            continue;
          }

          const session: MatchSession = JSON.parse(sessionData);

          // Check if session should be deleted
          if (session.status === 'ended') {
            await this.redis.client.del(key);
            deleted++;
            endedCount++;

            console.log(
              `🗑️  Deleted: ${key} | Status: ${session.status} | Users: ${session.users.join(', ')}`
            );
          }
        } catch (error) {
          errors++;
          console.error(`Error processing key ${key}:`, error);
        }

        // Log progress every 100 keys
        if (scanned % 100 === 0) {
          console.log(`Progress: ${scanned}/${keys.length} scanned, ${deleted} deleted`);
        }
      }

      // Update global stats
      this.stats.totalScanned += scanned;
      this.stats.totalDeleted += deleted;
      this.stats.rejectedDeleted += rejectedCount;
      this.stats.endedDeleted += endedCount;
      this.stats.lastCleanup = new Date();
      this.stats.errors += errors;

      const duration = Date.now() - startTime;
      
      console.log('\n' + '='.repeat(60));
      console.log('Cleanup Summary:');
      console.log(`   Scanned:  ${scanned} sessions`);
      console.log(`   Deleted:  ${deleted} sessions`);
      console.log(`   - Rejected: ${rejectedCount}`);
      console.log(`   - Ended:    ${endedCount}`);
      console.log(`   Errors:   ${errors}`);
      console.log(`   Duration: ${duration}ms`);
      console.log('='.repeat(60) + '\n');

      // Log cumulative stats
      console.log('📈 Cumulative Stats:');
      console.log(`   Total Scanned:  ${this.stats.totalScanned}`);
      console.log(`   Total Deleted:  ${this.stats.totalDeleted}`);
      console.log(`   - Rejected: ${this.stats.rejectedDeleted}`);
      console.log(`   - Ended:    ${this.stats.endedDeleted}`);
      console.log(`   Total Errors:   ${this.stats.errors}`);
      console.log(`   Last Cleanup:   ${this.stats.lastCleanup?.toISOString()}`);
      console.log('='.repeat(60) + '\n');

    } catch (error) {
      errors++;
      this.stats.errors++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Cleanup cycle failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  public getStats(): CleanupStats {
    return { ...this.stats };
  }
}
