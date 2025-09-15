import cron from 'node-cron';
import { WarmingEngine } from './WarmingEngine';

export function startCacheWarming(warmingEngine: WarmingEngine): void {
  // Start warming engine
  warmingEngine.start();

  // Schedule warming jobs
  // Every 5 minutes - warm trending topics
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Scheduled trending topics warming');
    warmingEngine.emit('scheduledWarming', 'trending');
  });

  // Every 15 minutes - warm popular content  
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ Scheduled popular content warming');
    warmingEngine.emit('scheduledWarming', 'popular');
  });

  // Every 30 minutes - warm user timelines
  cron.schedule('*/30 * * * *', () => {
    console.log('⏰ Scheduled user timelines warming');
    warmingEngine.emit('scheduledWarming', 'timelines');
  });

  console.log('📅 Cache warming scheduler initialized');
}
