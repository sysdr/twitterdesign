import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export interface CacheResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class CacheService {
  static async get(key: string): Promise<CacheResponse> {
    try {
      const response = await axios.get(`${API_BASE}/cache/${key}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<CacheResponse> {
    try {
      const response = await axios.post(`${API_BASE}/cache`, {
        key,
        value,
        ttl
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async delete(key: string): Promise<CacheResponse> {
    try {
      const response = await axios.delete(`${API_BASE}/cache/${key}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async mget(keys: string[]): Promise<CacheResponse> {
    try {
      const response = await axios.post(`${API_BASE}/cache/mget`, { keys });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async getStats(): Promise<CacheResponse> {
    try {
      const response = await axios.get(`${API_BASE}/cache/stats/overview`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  static async flushAll(): Promise<CacheResponse> {
    try {
      const response = await axios.delete(`${API_BASE}/cache/flush/all`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}
