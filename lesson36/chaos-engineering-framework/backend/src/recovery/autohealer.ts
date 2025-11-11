import { ServiceHealth } from '../chaos/types.js';

export class AutoHealer {
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  async attemptRecovery(service: string, health: ServiceHealth): Promise<boolean> {
    const attempts = this.recoveryAttempts.get(service) || 0;
    
    if (attempts >= this.maxRetries) {
      console.error(`[Recovery] Max retries reached for ${service}`);
      return false;
    }

    console.log(`[Recovery] Attempting to heal ${service} (attempt ${attempts + 1}/${this.maxRetries})`);
    
    this.recoveryAttempts.set(service, attempts + 1);

    try {
      const recovered = await this.performRecovery(service, health);
      
      if (recovered) {
        console.log(`[Recovery] Successfully recovered ${service}`);
        this.recoveryAttempts.delete(service);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[Recovery] Failed to recover ${service}:`, error);
      return false;
    }
  }

  private async performRecovery(service: string, health: ServiceHealth): Promise<boolean> {
    // Simulate recovery actions based on service type
    switch (service) {
      case 'database':
        return this.recoverDatabase();
      case 'cache':
        return this.recoverCache();
      case 'api':
        return this.recoverAPI();
      default:
        return this.genericRecovery(service);
    }
  }

  private async recoverDatabase(): Promise<boolean> {
    console.log('[Recovery] Attempting database failover to replica');
    await this.sleep(2000); // Simulate failover time
    
    // Clear database chaos injection
    if ((global as any).chaosInjections?.database) {
      delete (global as any).chaosInjections.database;
    }
    
    return true;
  }

  private async recoverCache(): Promise<boolean> {
    console.log('[Recovery] Restarting cache and warming with popular data');
    await this.sleep(1000);
    
    // Clear cache chaos injection
    if ((global as any).chaosInjections?.cache) {
      delete (global as any).chaosInjections.cache;
    }
    
    return true;
  }

  private async recoverAPI(): Promise<boolean> {
    console.log('[Recovery] Restarting API service');
    await this.sleep(1500);
    return true;
  }

  private async genericRecovery(service: string): Promise<boolean> {
    console.log(`[Recovery] Performing generic recovery for ${service}`);
    await this.sleep(1000);
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.recoveryAttempts.clear();
  }
}

export const autoHealer = new AutoHealer();
