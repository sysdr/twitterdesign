import express from 'express';
import cors from 'cors';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { MetricsCollector } from '../../shared/metrics';
import { SLISLOManager } from '../../monitoring/sli-slo-manager';
import { MLPredictor } from '../../monitoring/ml-predictor';

const app = express();
const PORT = process.env.PORT || 3000;
const tracer = trace.getTracer('api-service');
const metrics = MetricsCollector.getInstance();
const sliManager = new SLISLOManager();
const mlPredictor = new MLPredictor();

app.use(cors());
app.use(express.json());

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await metrics.getMetrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Timeline endpoint with tracing
app.get('/api/timeline/:userId', async (req, res) => {
  const startTime = Date.now();
  const span = tracer.startSpan('get_timeline', {
    attributes: {
      'user.id': req.params.userId,
      'http.method': 'GET',
      'http.route': '/api/timeline/:userId',
    },
  });

  try {
    metrics.activeConnections.inc({ service: 'api' });

    // Simulate timeline generation with varying latency
    const baseLatency = 50 + Math.random() * 150; // 50-200ms
    await new Promise(resolve => setTimeout(resolve, baseLatency));

    const timeline = {
      userId: req.params.userId,
      tweets: Array.from({ length: 50 }, (_, i) => ({
        id: `tweet-${i}`,
        content: `Tweet content ${i}`,
        timestamp: Date.now() - i * 60000,
      })),
    };

    const duration = (Date.now() - startTime) / 1000;
    
    // Record metrics
    metrics.requestDuration.observe(
      { service: 'api', method: 'GET', route: '/timeline', status: '200' },
      duration
    );
    metrics.requestCount.inc({ service: 'api', method: 'GET', route: '/timeline', status: '200' });

    // Record SLI
    sliManager.recordSLI({
      name: 'timeline_latency',
      value: duration,
      timestamp: Date.now(),
      labels: { user_id: req.params.userId },
    });

    // Add data point for ML prediction
    mlPredictor.addDataPoint('timeline_latency', duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    metrics.activeConnections.dec({ service: 'api' });
    res.json(timeline);
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    span.end();
    metrics.activeConnections.dec({ service: 'api' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tweet post endpoint
app.post('/api/tweet', async (req, res) => {
  const span = tracer.startSpan('post_tweet');

  try {
    const success = Math.random() > 0.001; // 99.9% success rate

    if (!success) throw new Error('Tweet post failed');

    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));

    sliManager.recordSLI({
      name: 'tweet_post_success',
      value: 1,
      timestamp: Date.now(),
      labels: { user_id: req.body.userId },
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({ success: true, tweetId: `tweet-${Date.now()}` });
  } catch (error) {
    sliManager.recordSLI({
      name: 'tweet_post_success',
      value: 0,
      timestamp: Date.now(),
      labels: { user_id: req.body.userId },
    });

    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    res.status(500).json({ error: 'Tweet post failed' });
  }
});

// SLO status endpoint
app.get('/api/slo-status', (req, res) => {
  const status = sliManager.getSLOStatus();
  res.json(status);
});

// Predictions endpoint
app.get('/api/predictions', async (req, res) => {
  const predictions = await Promise.all([
    mlPredictor.predict('timeline_latency', 0.2),
    mlPredictor.predict('cache_hit_rate', 0.85),
  ]);

  res.json(predictions.filter(p => p !== null));
});

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
  });
}
