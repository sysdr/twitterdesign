import { esClient, TWEET_INDEX, tweetIndexMapping } from '../config/elasticsearch';
import { Tweet, SearchQuery, SearchResult } from '../models/Tweet';
import { logger } from '../utils/logger';

export class SearchService {
  async initializeIndex(): Promise<void> {
    try {
      const exists = await esClient.indices.exists({ index: TWEET_INDEX });
      if (!exists) {
        await esClient.indices.create({
          index: TWEET_INDEX,
          body: tweetIndexMapping
        });
        logger.info(`Created index: ${TWEET_INDEX}`);
      }
    } catch (error) {
      logger.error('Failed to initialize index:', error);
      throw error;
    }
  }

  async indexTweet(tweet: Tweet): Promise<void> {
    try {
      await esClient.index({
        index: TWEET_INDEX,
        id: tweet.id,
        body: {
          ...tweet,
          indexedAt: new Date()
        }
      });
      logger.info(`Indexed tweet: ${tweet.id}`);
    } catch (error) {
      logger.error(`Failed to index tweet ${tweet.id}:`, error);
      throw error;
    }
  }

  async bulkIndexTweets(tweets: Tweet[]): Promise<void> {
    try {
      const body = tweets.flatMap(tweet => [
        { index: { _index: TWEET_INDEX, _id: tweet.id } },
        { ...tweet, indexedAt: new Date() }
      ]);

      const result = await esClient.bulk({ body });
      
      if (result.errors) {
        logger.error('Bulk indexing errors:', result.items);
      }
      
      logger.info(`Bulk indexed ${tweets.length} tweets`);
    } catch (error) {
      logger.error('Failed to bulk index tweets:', error);
      throw error;
    }
  }

  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    try {
      const { query, filters, sort = 'relevance', page = 1, size = 20, userId } = searchQuery;
      
      const esQuery: any = {
        index: TWEET_INDEX,
        body: {
          query: this.buildQuery(query, filters, userId),
          sort: this.buildSort(sort),
          highlight: {
            fields: {
              content: {
                pre_tags: ['<mark>'],
                post_tags: ['</mark>'],
                fragment_size: 150
              }
            }
          },
          aggs: {
            hashtags: {
              terms: { field: 'hashtags', size: 10 }
            },
            mentions: {
              terms: { field: 'mentions', size: 10 }
            },
            mediaTypes: {
              terms: { field: 'mediaType', size: 5 }
            }
          },
          from: (page - 1) * size,
          size
        }
      };

      const startTime = Date.now();
      const result = await esClient.search(esQuery);
      const took = Date.now() - startTime;

      const tweets = result.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
        highlight: hit.highlight
      }));

      // Get suggestions for partial matches
      const suggestions = await this.getSuggestions(query);

      return {
        tweets,
        total: result.hits.total.value,
        took,
        suggestions,
        facets: {
          hashtags: result.aggregations.hashtags.buckets,
          mentions: result.aggregations.mentions.buckets,
          mediaTypes: result.aggregations.mediaTypes.buckets
        }
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  private buildQuery(query: string, filters?: SearchQuery['filters'], userId?: string): any {
    const must: any[] = [];
    const filter: any[] = [];

    // Main text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['content^2', 'author.displayName', 'hashtags^1.5'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Apply filters
    if (filters?.hashtags?.length) {
      filter.push({ terms: { hashtags: filters.hashtags } });
    }

    if (filters?.mentions?.length) {
      filter.push({ terms: { mentions: filters.mentions } });
    }

    if (filters?.dateRange) {
      filter.push({
        range: {
          timestamp: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        }
      });
    }

    if (filters?.mediaType) {
      filter.push({ term: { mediaType: filters.mediaType } });
    }

    if (filters?.location) {
      filter.push({
        geo_distance: {
          distance: filters.location.radius,
          location: filters.location.center
        }
      });
    }

    if (filters?.verified !== undefined) {
      filter.push({ term: { isVerified: filters.verified } });
    }

    if (filters?.language) {
      filter.push({ term: { language: filters.language } });
    }

    // Personalization boost for followed users
    const should: any[] = [];
    if (userId) {
      should.push({
        term: {
          'author.id': {
            value: userId,
            boost: 2.0
          }
        }
      });
    }

    return {
      bool: {
        must,
        filter,
        should,
        boost: 1.0
      }
    };
  }

  private buildSort(sort: string): any[] {
    switch (sort) {
      case 'recent':
        return [{ timestamp: { order: 'desc' } }, '_score'];
      case 'popular':
        return [{ engagementScore: { order: 'desc' } }, '_score'];
      case 'relevance':
      default:
        return ['_score', { timestamp: { order: 'desc' } }];
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const result = await esClient.search({
        index: TWEET_INDEX,
        body: {
          suggest: {
            tweet_suggest: {
              completion: {
                field: 'content.suggest',
                prefix: query,
                size: 5
              }
            }
          }
        }
      });

      return result.suggest.tweet_suggest[0].options.map((option: any) => option.text);
    } catch (error) {
      logger.error('Failed to get suggestions:', error);
      return [];
    }
  }

  async deleteTweet(tweetId: string): Promise<void> {
    try {
      await esClient.delete({
        index: TWEET_INDEX,
        id: tweetId
      });
      logger.info(`Deleted tweet: ${tweetId}`);
    } catch (error) {
      logger.error(`Failed to delete tweet ${tweetId}:`, error);
      throw error;
    }
  }
}
