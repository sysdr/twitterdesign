import { AuthResponse, ThreatScore, SecurityEvent, SecurityStats } from '../types';

const API_BASE = '/api';

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 && this.refreshToken) {
      // Try to refresh token
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry original request
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      }
    }

    return response;
  }

  async register(username: string, email: string, password: string): Promise<{ user: any }> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (response.ok) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    
    return data;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch {
      this.clearTokens();
    }

    return false;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });
    this.clearTokens();
  }

  async getThreatScore(): Promise<ThreatScore> {
    const response = await this.request('/user/threat-score');
    return response.json();
  }

  async getSecurityEvents(): Promise<{ events: SecurityEvent[] }> {
    const response = await this.request('/security/events');
    return response.json();
  }

  async getSecurityStats(): Promise<{ stats: SecurityStats }> {
    const response = await this.request('/security/stats');
    return response.json();
  }
}

export const api = new ApiService();
