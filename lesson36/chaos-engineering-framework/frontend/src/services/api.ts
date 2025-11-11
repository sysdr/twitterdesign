const API_BASE = '/api';

export const chaosApi = {
  getExperiments: async () => {
    const response = await fetch(`${API_BASE}/experiments`);
    return response.json();
  },

  getActiveExperiments: async () => {
    const response = await fetch(`${API_BASE}/experiments/active`);
    return response.json();
  },

  startExperiment: async (experimentType: string) => {
    const response = await fetch(`${API_BASE}/experiments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentType })
    });
    return response.json();
  },

  stopExperiment: async (id: string) => {
    const response = await fetch(`${API_BASE}/experiments/stop/${id}`, {
      method: 'POST'
    });
    return response.json();
  },

  emergencyStop: async () => {
    const response = await fetch(`${API_BASE}/emergency-stop`, {
      method: 'POST'
    });
    return response.json();
  },

  getMetrics: async () => {
    const response = await fetch(`${API_BASE}/metrics`);
    return response.json();
  },

  getHealth: async () => {
    const response = await fetch('/health');
    return response.json();
  }
};
