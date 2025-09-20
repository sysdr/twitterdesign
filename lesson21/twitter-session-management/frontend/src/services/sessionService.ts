import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

class SessionService {
  async getSessionInfo() {
    const response = await axios.get(`${API_BASE}/session/info`);
    return response.data.session;
  }

  async getSessionStats() {
    const response = await axios.get(`${API_BASE}/session/stats`);
    return response.data.stats;
  }

  async revokeSession() {
    const response = await axios.delete(`${API_BASE}/session/revoke`);
    return response.data;
  }
}

export const sessionService = new SessionService();
