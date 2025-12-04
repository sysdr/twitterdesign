export class PricingModel {
  // AWS-like pricing (simplified)
  static readonly INSTANCE_HOURLY_RATES = {
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    't3.large': 0.0832,
    'm5.large': 0.096,
    'm5.xlarge': 0.192
  };

  static readonly DB_COSTS = {
    readQuery: 0.0000001,  // $0.0000001 per read
    writeQuery: 0.000001,  // $0.000001 per write
    storageGB: 0.10        // $0.10 per GB per month
  };

  static readonly CACHE_COSTS = {
    operationCost: 0.00000001,  // $0.00000001 per operation
    memoryGBHour: 0.02          // $0.02 per GB per hour
  };

  static readonly NETWORK_COSTS = {
    ingressGB: 0,           // Free
    egressGB: 0.09,         // $0.09 per GB
    crossRegion: 0.02       // $0.02 per GB cross-region
  };

  static calculateRequestCost(
    duration: number,
    dbReads: number,
    dbWrites: number,
    cacheOps: number,
    responseSize: number,
    instanceType: string = 't3.medium'
  ): number {
    const computeCost = (duration / 3600) * (this.INSTANCE_HOURLY_RATES[instanceType as keyof typeof this.INSTANCE_HOURLY_RATES] || this.INSTANCE_HOURLY_RATES['t3.medium']);
    const dbCost = (dbReads * this.DB_COSTS.readQuery) + (dbWrites * this.DB_COSTS.writeQuery);
    const cacheCost = cacheOps * this.CACHE_COSTS.operationCost;
    const networkCost = (responseSize / (1024 * 1024 * 1024)) * this.NETWORK_COSTS.egressGB;

    return computeCost + dbCost + cacheCost + networkCost;
  }

  static getInstanceHourlyCost(instanceType: string): number {
    return this.INSTANCE_HOURLY_RATES[instanceType as keyof typeof this.INSTANCE_HOURLY_RATES] || this.INSTANCE_HOURLY_RATES['t3.medium'];
  }
}
