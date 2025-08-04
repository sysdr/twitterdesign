import axios from 'axios';
import { Tweet, CreateTweetRequest } from '../types/tweet';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} - ${response.data?.responseTime || 'N/A'}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const createTweet = async (tweetData: CreateTweetRequest) => {
  const formData = new FormData();
  formData.append('content', tweetData.content);
  formData.append('authorId', tweetData.authorId);
  formData.append('authorUsername', tweetData.authorUsername);
  
  if (tweetData.parentTweetId) {
    formData.append('parentTweetId', tweetData.parentTweetId);
  }

  if (tweetData.mediaFiles) {
    tweetData.mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
  }

  const response = await api.post('/tweets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getTweets = async (filters?: any) => {
  const response = await api.get('/tweets', { params: filters });
  return response.data;
};

export const getTweet = async (id: string) => {
  const response = await api.get(`/tweets/${id}`);
  return response.data;
};

export const updateTweet = async (id: string, content: string) => {
  const response = await api.put(`/tweets/${id}`, { content });
  return response.data;
};

export const updateEngagement = async (tweetId: string, action: string, userId: string) => {
  const response = await api.post(`/tweets/${tweetId}/engagement`, { action, userId });
  return response.data;
};

export const getTweetVersions = async (tweetId: string) => {
  const response = await api.get(`/tweets/${tweetId}/versions`);
  return response.data;
};

export const deleteTweet = async (id: string) => {
  const response = await api.delete(`/tweets/${id}`);
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/tweets/system/stats');
  return response.data;
};
