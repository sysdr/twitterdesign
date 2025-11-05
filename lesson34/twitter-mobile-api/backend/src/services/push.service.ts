import webpush from 'web-push';
import { DatabaseService } from './database.service';
import { PushNotification } from '../../../shared/types';

export class PushService {
  constructor(private db: DatabaseService) {
    // Generate VAPID keys if not present
    const vapidKeys = webpush.generateVAPIDKeys();
    
    webpush.setVapidDetails(
      'mailto:admin@twitter-mobile-api.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
  
  async subscribe(userId: string, subscription: any): Promise<void> {
    this.db.savePushSubscription(userId, subscription);
  }
  
  async sendNotification(
    userId: string,
    notification: PushNotification
  ): Promise<void> {
    const subscriptions = this.db.getUserSubscriptions(userId);
    
    const payload = JSON.stringify(notification);
    
    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => console.error('Push notification failed:', err));
    });
    
    await Promise.all(promises);
  }
  
  async broadcastNotification(notification: PushNotification): Promise<void> {
    // In production, this would send to all active users
    console.log('Broadcasting notification:', notification);
  }
}
