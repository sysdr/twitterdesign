import { ABTest, ModelConfig } from '../types/index.js';
import { ValidationEngine } from './validationEngine.js';

export class ABTestingService {
  private activeTests: Map<string, ABTest> = new Map();
  private validationEngine: ValidationEngine;

  constructor(validationEngine: ValidationEngine) {
    this.validationEngine = validationEngine;
  }

  createTest(
    name: string,
    controlModel: ModelConfig,
    treatmentModel: ModelConfig,
    trafficSplit: { control: number; treatment: number } = { control: 90, treatment: 10 }
  ): ABTest {
    const test: ABTest = {
      id: `test_${Date.now()}`,
      name,
      controlModel: {
        name: controlModel.name,
        version: controlModel.version
      },
      treatmentModel: {
        name: treatmentModel.name,
        version: treatmentModel.version
      },
      status: 'running',
      trafficSplit,
      metrics: {
        control: {
          modelName: controlModel.name,
          modelVersion: controlModel.version,
          overallAccuracy: 0,
          mape: 0,
          validationCount: 0,
          lastUpdated: Date.now(),
          accuracyHistory: []
        },
        treatment: {
          modelName: treatmentModel.name,
          modelVersion: treatmentModel.version,
          overallAccuracy: 0,
          mape: 0,
          validationCount: 0,
          lastUpdated: Date.now(),
          accuracyHistory: []
        }
      },
      startTime: Date.now()
    };

    this.activeTests.set(test.id, test);
    return test;
  }

  updateTestMetrics(testId: string) {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return;

    // Get latest accuracy for both models
    const controlAccuracy = this.validationEngine.getModelAccuracy(
      test.controlModel.name,
      test.controlModel.version
    );
    const treatmentAccuracy = this.validationEngine.getModelAccuracy(
      test.treatmentModel.name,
      test.treatmentModel.version
    );

    if (controlAccuracy) test.metrics.control = controlAccuracy;
    if (treatmentAccuracy) test.metrics.treatment = treatmentAccuracy;

    // Check if we have enough data to make a decision
    if (controlAccuracy && treatmentAccuracy &&
        controlAccuracy.validationCount >= 30 && treatmentAccuracy.validationCount >= 30) {
      
      const controlResults = this.validationEngine.getRecentValidations(
        test.controlModel.name,
        30
      );
      const treatmentResults = this.validationEngine.getRecentValidations(
        test.treatmentModel.name,
        30
      );

      const significance = this.validationEngine.calculateStatisticalSignificance(
        controlResults,
        treatmentResults
      );

      if (significance.significant) {
        if (treatmentAccuracy.overallAccuracy > controlAccuracy.overallAccuracy) {
          test.winner = 'treatment';
        } else {
          test.winner = 'control';
        }
        test.status = 'completed';
        test.endTime = Date.now();
      }
    }
  }

  getTest(testId: string): ABTest | undefined {
    return this.activeTests.get(testId);
  }

  getAllTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  getActiveTests(): ABTest[] {
    return this.getAllTests().filter(t => t.status === 'running');
  }
}
