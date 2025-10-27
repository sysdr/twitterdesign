import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  requestTimeout: 60000,
  pingTimeout: 3000,
  sniffOnStart: false,
  sniffInterval: 300000,
  maxRetries: 5,
  resurrectStrategy: 'optimistic'
});

export const TWEET_INDEX = 'tweets';
export const SEARCH_ANALYTICS_INDEX = 'search-analytics';

export const tweetIndexMapping = {
  mappings: {
    properties: {
      id: { type: 'keyword' },
      content: { 
        type: 'text',
        analyzer: 'standard',
        search_analyzer: 'standard',
        fields: {
          exact: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple',
            search_analyzer: 'simple'
          }
        }
      },
      author: {
        type: 'object',
        properties: {
          id: { type: 'keyword' },
          username: { type: 'keyword' },
          displayName: { type: 'text' },
          verified: { type: 'boolean' },
          followerCount: { type: 'integer' }
        }
      },
      hashtags: { type: 'keyword' },
      mentions: { type: 'keyword' },
      mediaType: { type: 'keyword' },
      location: { type: 'geo_point' },
      timestamp: { type: 'date' },
      engagementScore: { type: 'float' },
      retweets: { type: 'integer' },
      likes: { type: 'integer' },
      replies: { type: 'integer' },
      isVerified: { type: 'boolean' },
      sentiment: { type: 'keyword' },
      language: { type: 'keyword' }
    }
  },
  settings: {
    number_of_shards: 3,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        tweet_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop', 'tweet_synonyms']
        }
      },
      filter: {
        tweet_synonyms: {
          type: 'synonym',
          synonyms: ['lol,laugh', 'omg,shocked', 'tbh,honestly']
        }
      }
    }
  }
};
