/**
 * Queuing Theory Models for Capacity Planning
 * Implements Little's Law and M/M/1 queue analysis
 */

export class QueuingTheoryModel {
  /**
   * Little's Law: L = λW
   * Average items in system = Arrival rate × Average time in system
   */
  static calculateLittlesLaw(arrivalRate: number, averageWaitTime: number): number {
    return arrivalRate * averageWaitTime;
  }

  /**
   * Calculate utilization: ρ = λ/μ
   * Must be < 1 for stable system
   */
  static calculateUtilization(arrivalRate: number, serviceRate: number): number {
    if (serviceRate === 0) return 1;
    return Math.min(arrivalRate / serviceRate, 0.999); // Cap at 99.9%
  }

  /**
   * M/M/1 Queue: Average wait time W = 1/(μ - λ)
   * Assumes single server, Poisson arrivals, exponential service times
   */
  static calculateAverageWaitTime(arrivalRate: number, serviceRate: number): number {
    if (serviceRate <= arrivalRate) {
      return Infinity; // Unstable queue
    }
    return 1 / (serviceRate - arrivalRate);
  }

  /**
   * M/M/1 Queue: Average queue length L = λ/(μ - λ) = ρ/(1 - ρ)
   */
  static calculateQueueLength(arrivalRate: number, serviceRate: number): number {
    if (serviceRate <= arrivalRate) {
      return Infinity;
    }
    const utilization = this.calculateUtilization(arrivalRate, serviceRate);
    return utilization / (1 - utilization);
  }

  /**
   * Calculate probability of n items in system: P(n) = ρ^n(1 - ρ)
   */
  static calculateProbability(n: number, utilization: number): number {
    return Math.pow(utilization, n) * (1 - utilization);
  }

  /**
   * Predict future metrics based on trend
   */
  static predictFutureMetrics(
    currentArrivalRate: number,
    arrivalRateTrend: number, // rate of change per second
    serviceRate: number,
    secondsAhead: number
  ): {
    utilization: number;
    waitTime: number;
    queueLength: number;
  } {
    const futureArrivalRate = currentArrivalRate + (arrivalRateTrend * secondsAhead);
    
    return {
      utilization: this.calculateUtilization(futureArrivalRate, serviceRate),
      waitTime: this.calculateAverageWaitTime(futureArrivalRate, serviceRate),
      queueLength: this.calculateQueueLength(futureArrivalRate, serviceRate)
    };
  }

  /**
   * Calculate optimal number of servers for M/M/c queue
   */
  static calculateOptimalServers(
    arrivalRate: number,
    serviceRatePerServer: number,
    targetUtilization: number = 0.7
  ): number {
    // Need c servers where cμ > λ and utilization ≤ target
    const minServers = Math.ceil(arrivalRate / serviceRatePerServer);
    const optimalServers = Math.ceil(arrivalRate / (serviceRatePerServer * targetUtilization));
    return Math.max(minServers + 1, optimalServers);
  }

  /**
   * Determine health status based on utilization
   */
  static determineHealth(utilization: number): 'healthy' | 'warning' | 'critical' {
    if (utilization < 0.7) return 'healthy';
    if (utilization < 0.85) return 'warning';
    return 'critical';
  }

  /**
   * Calculate time until utilization threshold breach
   */
  static calculateTimeToThreshold(
    currentUtilization: number,
    utilizationTrend: number, // change per second
    threshold: number
  ): number {
    if (utilizationTrend <= 0) return Infinity;
    const timeSeconds = (threshold - currentUtilization) / utilizationTrend;
    return Math.max(0, timeSeconds);
  }
}
