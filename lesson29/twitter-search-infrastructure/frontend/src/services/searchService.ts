import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const searchService = {
  async search(query: string, filters: any = {}) {
    const params: any = { q: query, ...filters };
    const response = await axios.get(`${API_BASE_URL}/api/search`, { params });
    return response.data.data;
  },

  async getSuggestions(query: string) {
    const response = await axios.get(`${API_BASE_URL}/api/suggest`, {
      params: { q: query }
    });
    return response.data.data.suggestions;
  },

  async getTrending() {
    const response = await axios.get(`${API_BASE_URL}/api/trending`);
    return response.data.data;
  }
};

