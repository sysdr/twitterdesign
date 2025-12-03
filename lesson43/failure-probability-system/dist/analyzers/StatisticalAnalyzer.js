"use strict";
// Statistical distribution fitting and failure rate estimation
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalAnalyzer = void 0;
class StatisticalAnalyzer {
    // Fit exponential distribution to time-between-failures data
    fitExponentialDistribution(metrics) {
        // Calculate inter-arrival times of high-stress events (proxy for failures)
        const stressEvents = metrics.filter(m => m.cpuUsage > 80 || m.memoryUsage > 85 || m.errorRate > 0.01);
        if (stressEvents.length < 2) {
            return { type: 'exponential', lambda: 0.001, aic: Infinity };
        }
        // Calculate time between stress events (in hours)
        const intervals = [];
        for (let i = 1; i < stressEvents.length; i++) {
            const interval = (stressEvents[i].timestamp - stressEvents[i - 1].timestamp) / 3600000;
            intervals.push(interval);
        }
        // Maximum Likelihood Estimation: lambda = n / sum(intervals)
        const lambda = intervals.length / intervals.reduce((a, b) => a + b, 0);
        // Calculate AIC for model selection
        const logLikelihood = intervals.reduce((sum, t) => sum + Math.log(lambda) - lambda * t, 0);
        const aic = 2 * 1 - 2 * logLikelihood; // k=1 parameter
        return { type: 'exponential', lambda, aic };
    }
    // Fit Weibull distribution for age-related degradation
    fitWeibullDistribution(metrics) {
        // For Weibull, we look at cumulative degradation patterns
        if (metrics.length < 10) {
            return { type: 'weibull', beta: 1, eta: 1, aic: Infinity };
        }
        // Simple Weibull fitting using method of moments
        const times = metrics.map((m, i) => i * 0.001); // Time in hours
        const failures = metrics.map(m => (m.cpuUsage > 80 ? 1 : 0) + (m.memoryUsage > 85 ? 1 : 0));
        // Estimate beta (shape) from failure pattern
        let beta = 1.0;
        const recentFailureRate = failures.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const earlyFailureRate = failures.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
        if (recentFailureRate > earlyFailureRate * 1.2) {
            beta = 1.3; // Increasing failure rate (wear-out)
        }
        else if (recentFailureRate < earlyFailureRate * 0.8) {
            beta = 0.7; // Decreasing failure rate (infant mortality)
        }
        // Estimate eta (scale)
        const meanTime = times[times.length - 1] / 2;
        const eta = meanTime / Math.pow(Math.log(2), 1 / beta);
        // Simplified AIC calculation
        const aic = 2 * 2; // k=2 parameters
        return { type: 'weibull', beta, eta, aic };
    }
    // Analyze failure rate trends
    analyzeFailureRate(metrics) {
        if (metrics.length < 20) {
            return {
                currentFailureRate: 0.001,
                trend: 'stable',
                confidence: 0,
                distribution: { type: 'exponential', lambda: 0.001, aic: Infinity }
            };
        }
        // Fit both distributions
        const expDist = this.fitExponentialDistribution(metrics);
        const weibullDist = this.fitWeibullDistribution(metrics);
        // Select best distribution based on AIC (lower is better)
        const bestDist = expDist.aic < weibullDist.aic ? expDist : weibullDist;
        // Calculate current failure rate
        const recentMetrics = metrics.slice(-20);
        const recentFailures = recentMetrics.filter(m => m.cpuUsage > 90 || m.memoryUsage > 90 || m.errorRate > 0.05).length;
        const currentFailureRate = recentFailures / recentMetrics.length;
        // Determine trend using linear regression on failure rates
        const trend = this.calculateTrend(metrics);
        // Confidence based on sample size and consistency
        const confidence = Math.min(0.95, metrics.length / 100);
        return {
            currentFailureRate: bestDist.lambda || 0.001,
            trend,
            confidence,
            distribution: bestDist
        };
    }
    calculateTrend(metrics) {
        if (metrics.length < 30)
            return 'stable';
        const windowSize = 10;
        const windows = Math.floor(metrics.length / windowSize);
        const rates = [];
        for (let i = 0; i < windows; i++) {
            const window = metrics.slice(i * windowSize, (i + 1) * windowSize);
            const failures = window.filter(m => m.cpuUsage > 85).length;
            rates.push(failures / windowSize);
        }
        // Simple linear regression
        const n = rates.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = rates.reduce((a, b) => a + b, 0);
        const sumXY = rates.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        if (slope > 0.01)
            return 'increasing';
        if (slope < -0.01)
            return 'decreasing';
        return 'stable';
    }
}
exports.StatisticalAnalyzer = StatisticalAnalyzer;
