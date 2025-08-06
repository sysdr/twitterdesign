import axios from 'axios';
import { Tweet, TimelineResponse, User } from '../types/timeline';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const timelineApi = {
  getTimeline: async (cursor?: string, limit: number = 20): Promise<TimelineResponse> => {
    const response = await api.get('/timeline', {
      params: { cursor, limit }
    });
    return response.data;
  },

  getTweet: async (id: string): Promise<Tweet> => {
    const response = await api.get(`/tweets/${id}`);
    return response.data;
  },

  postTweet: async (content: string): Promise<Tweet> => {
    const response = await api.post('/tweets', { content });
    return response.data;
  },

  likeTweet: async (id: string): Promise<void> => {
    await api.post(`/tweets/${id}/like`);
  },

  retweetTweet: async (id: string): Promise<void> => {
    await api.post(`/tweets/${id}/retweet`);
  }
};

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  followUser: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/follow`);
  },

  unfollowUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/follow`);
  }
};
