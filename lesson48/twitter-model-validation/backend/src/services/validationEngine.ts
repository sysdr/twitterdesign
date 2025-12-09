import { ModelPrediction, ActualMetric, ValidationResult, ModelAccuracy } from '../types/index.js';
import * as stats from 'simple-statistics';

export class ValidationEngine {
  private validationResults: ValidationResult[] = [];
  private accuracyHistory: Map<string, ModelAccuracy> = new Map();

  validate(
    prediction: ModelPrediction,
    actualMetrics: ActualMetric[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const pred of prediction.predictions) {
      // Find matching actual metrics in the time window
      const matchingMetrics = actualMetrics.filter(m =>
        m.metricName === pred.metricName &&
        m.timestamp >= prediction.timeWindow.start &&
        m.timestamp <= prediction.timeWindow.end
      );

      if (matchingMetrics.length === 0) continue;

      // Calculate average actual value
      const actualValues = matchingMetrics.map(m => m.actualValue);
      const actualValue = stats.mean(actualValues);

      // Calculate errors
      const absoluteError = Math.abs(pred.predictedValue - actualValue);
      const percentageError = (absoluteError / actualValue) * 100;
      const accuracy = Math.max(0, 100 - percentageError);

      const result: ValidationResult = {
        modelName: prediction.modelName,
        modelVersion: prediction.modelVersion,
        timeWindow: prediction.timeWindow,
        metricName: pred.metricName,
        predictedValue: pred.predictedValue,
        actualValue,
        absoluteError,
        percentageError,
        accuracy,
        timestamp: Date.now()
      };

      results.push(result);
      this.storeValidationResult(result);
    }

    return results;
  }

  private storeValidationResult(result: ValidationResult) {
    this.validationResults.push(result);

    // Update accuracy history
    const key = `${result.modelName}_${result.modelVersion}`;
    let modelAccuracy = this.accuracyHistory.get(key);

    if (!modelAccuracy) {
      modelAccuracy = {
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        overallAccuracy: 0,
        mape: 0,
        validationCount: 0,
        lastUpdated: Date.now(),
        accuracyHistory: []
      };
    }

    modelAccuracy.accuracyHistory.push({
      timestamp: result.timestamp,
      accuracy: result.accuracy
    });

    // Keep only last 100 entries
    if (modelAccuracy.accuracyHistory.length > 100) {
      modelAccuracy.accuracyHistory = modelAccuracy.accuracyHistory.slice(-100);
    }

    // Recalculate overall metrics
    const recentResults = this.validationResults
      .filter(r => r.modelName === result.modelName && r.modelVersion === result.modelVersion)
      .slice(-50);

    const accuracies = recentResults.map(r => r.accuracy);
    const percentageErrors = recentResults.map(r => r.percentageError);

    modelAccuracy.overallAccuracy = stats.mean(accuracies);
    modelAccuracy.mape = stats.mean(percentageErrors);
    modelAccuracy.validationCount = recentResults.length;
    modelAccuracy.lastUpdated = Date.now();

    this.accuracyHistory.set(key, modelAccuracy);
  }

  getModelAccuracy(modelName: string, modelVersion: string): ModelAccuracy | undefined {
    return this.accuracyHistory.get(`${modelName}_${modelVersion}`);
  }

  getAllModelAccuracies(): ModelAccuracy[] {
    return Array.from(this.accuracyHistory.values());
  }

  getRecentValidations(modelName: string, count: number = 50): ValidationResult[] {
    return this.validationResults
      .filter(r => r.modelName === modelName)
      .slice(-count);
  }

  checkAccuracyThreshold(modelName: string, threshold: number = 95): boolean {
    const recentResults = this.getRecentValidations(modelName, 10);
    if (recentResults.length === 0) return true;

    const avgAccuracy = stats.mean(recentResults.map(r => r.accuracy));
    return avgAccuracy >= threshold;
  }

  calculateStatisticalSignificance(
    controlResults: ValidationResult[],
    treatmentResults: ValidationResult[]
  ): { pValue: number; significant: boolean } {
    if (controlResults.length < 10 || treatmentResults.length < 10) {
      return { pValue: 1, significant: false };
    }

    const controlAccuracies = controlResults.map(r => r.accuracy);
    const treatmentAccuracies = treatmentResults.map(r => r.accuracy);

    // Simple t-test approximation
    const controlMean = stats.mean(controlAccuracies);
    const treatmentMean = stats.mean(treatmentAccuracies);
    const controlStd = stats.standardDeviation(controlAccuracies);
    const treatmentStd = stats.standardDeviation(treatmentAccuracies);

    const pooledStd = Math.sqrt(
      (controlStd ** 2) / controlResults.length +
      (treatmentStd ** 2) / treatmentResults.length
    );

    const tStat = Math.abs(treatmentMean - controlMean) / pooledStd;
    const pValue = 2 * (1 - this.normalCDF(tStat));

    return {
      pValue,
      significant: pValue < 0.05
    };
  }

  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
