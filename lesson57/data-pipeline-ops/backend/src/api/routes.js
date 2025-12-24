export function setupRoutes(app, orchestrator, metrics) {
  
  app.get('/health', (req, res) => {
    const status = orchestrator.getStatus();
    res.json({
      status: 'healthy',
      state: status.state,
      timestamp: Date.now()
    });
  });

  app.get('/status', (req, res) => {
    const status = orchestrator.getStatus();
    res.json(status);
  });

  app.get('/metrics', (req, res) => {
    metrics.update(
      orchestrator.metrics,
      orchestrator.validator,
      orchestrator.recovery,
      orchestrator.storage
    );
    res.json(metrics.getSnapshot());
  });

  app.get('/pipelines', (req, res) => {
    const pipelines = Array.from(orchestrator.pipelines.values());
    res.json(pipelines);
  });

  app.get('/lineage/:eventId', async (req, res) => {
    const lineage = await orchestrator.lineage.getLineage(req.params.eventId);
    res.json({ eventId: req.params.eventId, lineage });
  });

  app.get('/validation/stats', (req, res) => {
    res.json(orchestrator.validator.getStats());
  });

  app.get('/recovery/stats', (req, res) => {
    res.json(orchestrator.recovery.getStats());
  });

  app.post('/pipelines/:name/pause', async (req, res) => {
    const pipeline = orchestrator.pipelines.get(req.params.name);
    if (pipeline) {
      pipeline.state = 'paused';
      res.json({ success: true, pipeline: req.params.name, state: 'paused' });
    } else {
      res.status(404).json({ error: 'Pipeline not found' });
    }
  });

  app.post('/pipelines/:name/resume', async (req, res) => {
    const pipeline = orchestrator.pipelines.get(req.params.name);
    if (pipeline) {
      pipeline.state = 'active';
      res.json({ success: true, pipeline: req.params.name, state: 'active' });
    } else {
      res.status(404).json({ error: 'Pipeline not found' });
    }
  });
}
