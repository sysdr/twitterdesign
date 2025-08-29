import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService.js';
import { TrendingService } from '../services/TrendingService.js';

const searchService = new SearchService();
const trendingService = new TrendingService();

export class SearchController {
  async search(req: Request, res: Response) {
    try {
      const { q: query, limit = '20', offset = '0' } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const results = await searchService.searchContent(
        query, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      res.json({
        query,
        results,
        total: results.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async suggestions(req: Request, res: Response) {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.json({ suggestions: [] });
      }

      const suggestions = await searchService.getSearchSuggestions(query);
      res.json({ suggestions });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async trending(req: Request, res: Response) {
    try {
      const topics = await trendingService.getTrendingTopics();
      res.json({ trending: topics });
    } catch (error) {
      console.error('Trending error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
