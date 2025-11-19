// Little's Law: L = λW
export function littlesLaw(arrivalRate: number, serviceTime: number): number {
  return arrivalRate * serviceTime;
}

// Calculate utilization: ρ = λ / (c × μ)
export function calculateUtilization(
  arrivalRate: number,
  serviceTime: number,
  numServers: number
): number {
  const serviceRate = 1 / serviceTime;
  return arrivalRate / (numServers * serviceRate);
}

// Erlang-C formula for probability of queuing in M/M/c
export function erlangC(numServers: number, utilization: number): number {
  if (utilization >= 1) return 1;
  
  const rho = utilization * numServers;
  
  // Calculate (c*ρ)^c / c!
  let numerator = Math.pow(rho, numServers);
  let factorial = 1;
  for (let i = 2; i <= numServers; i++) {
    factorial *= i;
  }
  numerator /= factorial;
  
  // Calculate sum for denominator
  let sum = 0;
  for (let k = 0; k < numServers; k++) {
    let term = Math.pow(rho, k);
    let kFactorial = 1;
    for (let i = 2; i <= k; i++) {
      kFactorial *= i;
    }
    sum += term / kFactorial;
  }
  
  const denominator = sum + numerator / (1 - utilization);
  return numerator / (denominator * (1 - utilization));
}

// Average wait time in queue (M/M/c)
export function averageWaitTime(
  numServers: number,
  arrivalRate: number,
  serviceTime: number
): number {
  const utilization = calculateUtilization(arrivalRate, serviceTime, numServers);
  if (utilization >= 1) return Infinity;
  
  const Pc = erlangC(numServers, utilization);
  const serviceRate = 1 / serviceTime;
  
  return Pc / (numServers * serviceRate * (1 - utilization));
}

// Average response time (wait + service)
export function averageResponseTime(
  numServers: number,
  arrivalRate: number,
  serviceTime: number
): number {
  return averageWaitTime(numServers, arrivalRate, serviceTime) + serviceTime;
}

// Calculate percentile latency using exponential approximation
export function percentileLatency(
  percentile: number,
  avgResponseTime: number,
  variance: number
): number {
  // Using log-normal approximation for response time distribution
  const mu = Math.log(avgResponseTime) - variance / 2;
  const sigma = Math.sqrt(variance);
  
  // Inverse CDF of log-normal
  const z = normalInverseCDF(percentile / 100);
  return Math.exp(mu + sigma * z);
}

// Approximation of inverse normal CDF
function normalInverseCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  
  // Rational approximation
  const a = [
    -3.969683028665376e1, 2.209460984245205e2,
    -2.759285104469687e2, 1.383577518672690e2,
    -3.066479806614716e1, 2.506628277459239e0
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2,
    -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1
  ];
  
  const q = p < 0.5 ? p : 1 - p;
  const r = Math.sqrt(-2 * Math.log(q));
  
  let num = a[0];
  let den = 1;
  for (let i = 1; i < 6; i++) {
    num = num * r + a[i];
    if (i < 5) den = den * r + b[i - 1];
  }
  
  const result = num / den;
  return p < 0.5 ? -result : result;
}

// Optimal pool size calculation
export function optimalPoolSize(
  arrivalRate: number,
  serviceTime: number,
  targetUtilization: number = 0.7
): number {
  const minConnections = littlesLaw(arrivalRate, serviceTime);
  return Math.ceil(minConnections / targetUtilization);
}
