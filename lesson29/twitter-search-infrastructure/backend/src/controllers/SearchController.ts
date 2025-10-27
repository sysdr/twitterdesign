import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { SearchQuery } from '../models/Tweet';
import { logger } from '../utils/logger';

export class SearchController {
  private searchService = new SearchService();

  constructor() {
    this.search = this.search.bind(this);
    this.suggest = this.suggest.bind(this);
    this.trending = this.trending.bind(this);
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const searchQuery: SearchQuery = {
        query: req.query.q as string || '',
        filters: {
          hashtags: req.query.hashtags ? (req.query.hashtags as string).split(',') : undefined,
          mentions: req.query.mentions ? (req.query.mentions as string).split(',') : undefined,
          mediaType: req.query.mediaType as string,
          verified: req.query.verified ? req.query.verified === 'true' : undefined,
          language: req.query.language as string,
          dateRange: req.query.since || req.query.until ? {
            start: req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: req.query.until ? new Date(req.query.until as string) : new Date()
          } : undefined
        },
        sort: (req.query.sort as string) || 'relevance',
        page: parseInt(req.query.page as string) || 1,
        size: parseInt(req.query.size as string) || 20,
        userId: req.query.userId as string
      };

      const result = await this.searchService.search(searchQuery);
      
      res.json({
        success: true,
        data: result,
        pagination: {
          page: searchQuery.page,
          size: searchQuery.size,
          total: result.total,
          pages: Math.ceil(result.total / (searchQuery.size || 20))
        }
      });

    } catch (error) {
      logger.error('Search controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }
  }

  async suggest(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        res.json({ success: true, data: { suggestions: [] } });
        return;
      }

      const suggestions = await this.searchService.getSuggestions(query);
      res.json({
        success: true,
        data: { suggestions }
      });

    } catch (error) {
      logger.error('Suggestions controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions'
      });
    }
  }

  async trending(req: Request, res: Response): Promise<void> {
    try {
      // Get trending hashtags from last 24 hours
      const trending = await this.searchService.search({
        query: '',
        filters: {
          dateRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          }
        },
        sort: 'popular',
        size: 0
      });

      res.json({
        success: true,
        data: {
          trending: trending.facets?.hashtags.slice(0, 10) || []
        }
      });

    } catch (error) {
      logger.error('Trending controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trending topics'
      });
    }
  }
}
