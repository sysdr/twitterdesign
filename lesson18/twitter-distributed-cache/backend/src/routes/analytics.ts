import { Router } from 'express';
import { MetricsCollector } from '../services/MetricsCollector';

const router = Router();
const metricsCollector = MetricsCollector.getInstance();

// Get real-time metrics
router.get('/metrics/realtime', async (req, res) => {
  try {
    const metrics = await metricsCollector.getRealTimeMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Get Prometheus metrics
router.get('/metrics/prometheus', async (req, res) => {
  try {
    const metrics = await metricsCollector.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
