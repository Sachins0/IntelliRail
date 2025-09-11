export interface Station {
  id: string;
  name: string;
  platforms: number;
}

export interface Train {
  id: string;
  name: string;
  type: 'express' | 'local' | 'freight';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  delay_minutes: number;
  speed_kmh: number;
}

export interface TrainMovement {
  train_id: string;
  from_station: string;
  to_station: string;
  scheduled_departure_hour: number;
  scheduled_arrival_hour: number;
  platform: number;
  delay_minutes: number;
}

export interface OptimizedMovement {
  train_id: string;
  from_station: string;
  to_station: string;
  original_departure: number;
  optimized_departure: number;
  original_platform: number;
  optimized_platform: number;
  original_delay: number;
  optimized_delay: number;
}

export interface OptimizationResult {
  status: string;
  movements: OptimizedMovement[];
  metrics: {
    total_delay_before: number;
    total_delay_after: number;
    improvement_percent: number;
    conflicts_resolved: number;
  };
}