import axios from 'axios';
import { Train, Station, TrainMovement, OptimizationResult } from './types';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export const railwayApi = {
  getDemoData: async () => {
    const response = await api.get('/api/demo-data');
    return response.data;
  },

  optimize: async (data: { trains: Train[]; stations: Station[]; movements: TrainMovement[] }) => {
    const response = await api.post('/api/optimize', data);
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/api/status');
    return response.data;
  }
};
