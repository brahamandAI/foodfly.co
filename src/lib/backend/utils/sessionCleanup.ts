import { SessionManager } from './sessionManager';
import cron from 'node-cron';

export class SessionCleanupService {
  private static cleanupJob: any = null;

  // Start the cleanup service (run every hour)
  static startCleanupService() {
    if (this.cleanupJob) {
      console.log('Session cleanup service is already running');
      return;
    }

    console.log('🧹 Starting session cleanup service...');
    
    // Schedule cleanup every hour
    this.cleanupJob = cron.schedule('0 * * * *', async () => {
      console.log('🧹 Running session cleanup...');
      try {
        await SessionManager.cleanupExpiredSessions();
        console.log('✅ Session cleanup completed');
      } catch (error) {
        console.error('❌ Error during session cleanup:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('✅ Session cleanup service started (runs every hour)');
  }

  // Stop the cleanup service
  static stopCleanupService() {
    if (this.cleanupJob) {
      this.cleanupJob.destroy();
      this.cleanupJob = null;
      console.log('🛑 Session cleanup service stopped');
    }
  }

  // Manual cleanup trigger
  static async runCleanup(): Promise<void> {
    console.log('🧹 Manual session cleanup triggered...');
    try {
      await SessionManager.cleanupExpiredSessions();
      console.log('✅ Manual session cleanup completed');
    } catch (error) {
      console.error('❌ Error during manual session cleanup:', error);
      throw error;
    }
  }

  // Get cleanup service status
  static isRunning(): boolean {
    return this.cleanupJob !== null;
  }
}