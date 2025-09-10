export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  platforms: number;
}

export interface Train {
  id: string;
  name: string;
  type: 'express' | 'local' | 'freight' | 'special';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  current_station?: string;
  next_station?: string;
  delay_minutes: number;
  speed_kmh: number;
  length_meters: number;
}

export interface TrainMovement {
  train_id: string;
  from_station: string;
  to_station: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  platform?: number;
  optimized_departure?: string;
  delay_minutes?: number;
}

export interface OptimizationResult {
  status: string;
  objective_value?: number;
  movements: TrainMovement[];
}

export interface DisruptionPrediction {
  train_id: string;
  from_station: string;
  to_station: string;
  disruption_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  predicted_delay_minutes: number;
  recommendations: string[];
}