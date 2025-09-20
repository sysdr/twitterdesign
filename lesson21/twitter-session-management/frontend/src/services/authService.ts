import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

class AuthService {
  private token = '';

  constructor() {
    axios.defaults.withCredentials = true;
  }

  setToken(token: string) {
    this.token = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  async login(email: string, password: string, region: string) {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password,
      region
    });
    return response.data;
  }

  async logout() {
    const response = await axios.post(`${API_BASE}/auth/logout`);
    return response.data;
  }

  async refreshToken() {
    const response = await axios.post(`${API_BASE}/auth/refresh`);
    return response.data;
  }

  async getSessionInfo() {
    const response = await axios.get(`${API_BASE}/session/info`);
    return response.data.session;
  }
}

export const authService = new AuthService();
