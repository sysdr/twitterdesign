import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { refreshToken } = useAuthStore.getState();
            if (refreshToken) {
              const response = await this.refreshTokens(refreshToken);
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
              
              useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async register(userData: { email: string; username: string; password: string }) {
    return this.api.post('/auth/register', userData);
  }

  async login(credentials: { email: string; password: string; deviceFingerprint?: string }) {
    return this.api.post('/auth/login', credentials);
  }

  async refreshTokens(refreshToken: string) {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string) {
    return this.api.post('/auth/logout', { refreshToken });
  }

  async getProfile() {
    return this.api.get('/auth/profile');
  }

  // Tweet-related endpoints (placeholder for integration)
  async getTweets() {
    return this.api.get('/tweets');
  }

  async createTweet(content: string) {
    return this.api.post('/tweets', { content });
  }

  // Analytics endpoints
  async get(endpoint: string) {
    return this.api.get(endpoint);
  }

  async post(endpoint: string, data?: any) {
    return this.api.post(endpoint, data);
  }
}

export default new ApiService();
