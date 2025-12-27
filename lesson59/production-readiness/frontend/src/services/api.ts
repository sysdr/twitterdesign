import axios from 'axios';
import { AssessmentResult } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const runAssessment = async (): Promise<AssessmentResult> => {
  const response = await axios.post(`${API_URL}/assessment/run`);
  return response.data.assessment;
};

export const getLatestAssessment = async (): Promise<AssessmentResult | null> => {
  try {
    const response = await axios.get(`${API_URL}/assessment/latest`);
    return response.data.success ? response.data.assessment : null;
  } catch (error) {
    return null;
  }
};

export const getAssessmentReport = async (): Promise<string> => {
  const response = await axios.get(`${API_URL}/assessment/report`);
  return response.data;
};
