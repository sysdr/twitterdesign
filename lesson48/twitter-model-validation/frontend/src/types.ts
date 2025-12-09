export interface ValidationResult {
  modelName: string;
  modelVersion: string;
  timeWindow: {
    start: number;
    end: number;
  };
  metricName: string;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  accuracy: number;
  timestamp: number;
}

export interface ModelAccuracy {
  modelName: string;
  modelVersion: string;
  overallAccuracy: number;
  mape: number;
  validationCount: number;
  lastUpdated: number;
  accuracyHistory: {
    timestamp: number;
    accuracy: number;
  }[];
}

export interface ABTest {
  id: string;
  name: string;
  controlModel: {
    name: string;
    version: string;
  };
  treatmentModel: {
    name: string;
    version: string;
  };
  status: 'running' | 'completed' | 'failed';
  trafficSplit: {
    control: number;
    treatment: number;
  };
  metrics: {
    control: ModelAccuracy;
    treatment: ModelAccuracy;
  };
  startTime: number;
  endTime?: number;
  winner?: 'control' | 'treatment' | 'inconclusive';
}
