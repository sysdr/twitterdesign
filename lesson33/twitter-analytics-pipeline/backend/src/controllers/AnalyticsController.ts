import { Router, Request, Response } from 'express';
import { FeatureStore } from '../services/FeatureStore';
import { DataLakeService } from '../services/DataLakeService';

export class AnalyticsController {
  public router = Router();

  constructor(
    private featureStore: FeatureStore,
    private dataLake: DataLakeService
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/metrics', this.getRealTimeMetrics.bind(this));
    this.router.get('/engagement/:period', this.getEngagementData.bind(this));
    this.router.get('/trending', this.getTrendingTopics.bind(this));
    this.router.get('/user-growth/:period', this.getUserGrowth.bind(this));
    this.router.get('/features/:userId', this.getUserFeatures.bind(this));
  }

  async getRealTimeMetrics(req: Request, res: Response) {
    try {
      const metrics = await this.featureStore.getRealTimeMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get real-time metrics' });
    }
  }

  async getEngagementData(req: Request, res: Response) {
    try {
      const { period } = req.params;
      const data = await this.dataLake.getEngagementData(period);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get engagement data' });
    }
  }

  async getTrendingTopics(req: Request, res: Response) {
    try {
      const topics = await this.featureStore.getTrendingTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trending topics' });
    }
  }

  async getUserGrowth(req: Request, res: Response) {
    try {
      const { period } = req.params;
      const growth = await this.dataLake.getUserGrowthData(period);
      res.json(growth);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user growth data' });
    }
  }

  async getUserFeatures(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const features = await this.featureStore.getUserFeatures(userId);
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user features' });
    }
  }
}
