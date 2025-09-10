import axios from 'axios';
import { Train, Station, TrainMovement, OptimizationResult, DisruptionPrediction } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const railwayApi = {
  // Generate sample data
  generateData: async (trainCount: number = 8, stationCount: number = 5) => {
    const response = await api.post('/api/generate-data', {
      train_count: trainCount,
      station_count: stationCount,
    });
    return response.data;
  },

  // Get current system status
  getSystemStatus: async () => {
    const response = await api.get('/api/status');
    return response.data;
  },

  // Optimize schedule
  optimizeSchedule: async (data: {
    trains: Train[];
    stations: Station[];
    movements: TrainMovement[];
  }): Promise<OptimizationResult> => {
    const response = await api.post('/api/optimize', data);
    return response.data;
  },

  // Get disruption predictions
  getPredictions: async (movements: TrainMovement[]): Promise<DisruptionPrediction[]> => {
    const response = await api.post('/api/predict-disruptions', { movements });
    return response.data;
  },

  // Get real-time updates (WebSocket simulation)
  subscribeToUpdates: (callback: (data: any) => void) => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      callback({
        timestamp: new Date().toISOString(),
        type: 'train_update',
        data: {
          train_id: 'TRN_001',
          delay_minutes: Math.floor(Math.random() * 30),
          current_station: 'STN_002',
        },
      });
    }, 5000);

    return () => clearInterval(interval);
  },
};