export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface SLIMetric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

export interface SLO {
  name: string;
  target: number;
  window: string;
  sli: string;
}

export interface AlertPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeToThreshold: number;
  confidence: number;
  timestamp: number;
}

export interface TraceData {
  traceId: string;
  spans: SpanData[];
  duration: number;
  status: 'ok' | 'error';
}

export interface SpanData {
  spanId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  startTime: number;
  duration: number;
  attributes: Record<string, any>;
  status: 'ok' | 'error';
}
