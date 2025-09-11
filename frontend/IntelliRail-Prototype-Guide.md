# IntelliRail: Complete Prototype Development Guide

## Phase 1: Project Setup & Environment Configuration

### 1.1 Development Environment Setup
```bash
# Create project directory
mkdir intellirail-prototype
cd intellirail-prototype

# Initialize git repository
git init
echo "node_modules/" > .gitignore
echo ".env*" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
```

### 1.2 Backend Setup (Python + FastAPI)
```bash
# Create backend directory
mkdir backend
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
ortools==9.8.3296
torch==2.1.1
numpy==1.24.3
pandas==2.0.3
redis==5.0.1
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
python-dotenv==1.0.0
cors==1.0.1
websockets==12.0
langchain==0.0.340
openai==1.3.0
python-multipart==0.0.6
jinja2==3.1.2
EOF

# Install dependencies
pip install -r requirements.txt
```

### 1.3 Frontend Setup (Next.js + TypeScript)
```bash
# Navigate to project root
cd ..

# Create Next.js frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend

# Install additional dependencies
npm install chart.js react-chartjs-2 d3 @types/d3 recharts lucide-react
npm install @heroicons/react socket.io-client axios date-fns
```

---

## Phase 2: Backend Core Development

### 2.1 Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── train.py
│   │   └── schedule.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── optimization.py
│   │   ├── prediction.py
│   │   └── explanation.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   └── utils/
│       ├── __init__.py
│       ├── data_generator.py
│       └── helpers.py
├── data/
└── requirements.txt
```

### 2.2 Configuration Setup (app/config.py)
```python
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/intellirail"
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # AI Configuration
    OPENAI_API_KEY: str = ""
    
    # Railway Configuration
    MAX_TRAINS: int = 10
    MAX_STATIONS: int = 5
    OPTIMIZATION_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.3 Data Models (app/models/train.py)
```python
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum

class TrainType(Enum):
    EXPRESS = "express"
    LOCAL = "local"
    FREIGHT = "freight"
    SPECIAL = "special"

class TrainPriority(Enum):
    HIGH = 3
    MEDIUM = 2
    LOW = 1

class Station(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    platforms: int

class Train(BaseModel):
    id: str
    name: str
    type: TrainType
    priority: TrainPriority
    current_station: Optional[str] = None
    next_station: Optional[str] = None
    delay_minutes: int = 0
    speed_kmh: float = 80.0
    length_meters: float = 200.0
    
class TrainMovement(BaseModel):
    train_id: str
    from_station: str
    to_station: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    platform: Optional[int] = None

class OptimizationRequest(BaseModel):
    trains: List[Train]
    stations: List[Station]
    movements: List[TrainMovement]
    time_horizon_hours: int = 8
    objective: str = "minimize_delay"
```

### 2.4 Data Generator (app/utils/data_generator.py)
```python
import random
from datetime import datetime, timedelta
from typing import List, Tuple
from app.models.train import Train, Station, TrainMovement, TrainType, TrainPriority

class RailwayDataGenerator:
    def __init__(self):
        self.station_names = [
            "Central Junction", "North Terminal", "South Gate",
            "East Station", "West Hub", "Metro Center",
            "Industrial Yard", "Express Plaza"
        ]
        
    def generate_stations(self, count: int = 5) -> List[Station]:
        stations = []
        for i in range(count):
            station = Station(
                id=f"STN_{i+1:03d}",
                name=self.station_names[i % len(self.station_names)],
                latitude=28.6139 + random.uniform(-0.5, 0.5),
                longitude=77.2090 + random.uniform(-0.5, 0.5),
                platforms=random.randint(2, 8)
            )
            stations.append(station)
        return stations
    
    def generate_trains(self, count: int = 8) -> List[Train]:
        trains = []
        train_types = list(TrainType)
        priorities = list(TrainPriority)
        
        for i in range(count):
            train = Train(
                id=f"TRN_{i+1:03d}",
                name=f"Express {i+1:03d}",
                type=random.choice(train_types),
                priority=random.choice(priorities),
                delay_minutes=random.randint(0, 30),
                speed_kmh=random.uniform(60, 120),
                length_meters=random.uniform(150, 300)
            )
            trains.append(train)
        return trains
    
    def generate_movements(self, trains: List[Train], stations: List[Station]) -> List[TrainMovement]:
        movements = []
        base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
        
        for train in trains:
            # Generate 2-4 movements per train
            num_movements = random.randint(2, 4)
            current_time = base_time + timedelta(hours=random.randint(0, 2))
            
            for j in range(num_movements):
                from_station = random.choice(stations)
                to_station = random.choice([s for s in stations if s.id != from_station.id])
                
                # Calculate journey time based on distance and speed
                journey_time = timedelta(minutes=random.randint(30, 120))
                
                movement = TrainMovement(
                    train_id=train.id,
                    from_station=from_station.id,
                    to_station=to_station.id,
                    scheduled_departure=current_time,
                    scheduled_arrival=current_time + journey_time,
                    platform=random.randint(1, from_station.platforms)
                )
                movements.append(movement)
                current_time += journey_time + timedelta(minutes=random.randint(15, 45))
        
        return movements
```

### 2.5 Optimization Engine (app/services/optimization.py)
```python
from ortools.sat.python import cp_model
from typing import List, Dict, Tuple
import numpy as np
from app.models.train import Train, Station, TrainMovement, OptimizationRequest

class RailwayOptimizer:
    def __init__(self):
        self.model = None
        self.solver = None
        
    def optimize_schedule(self, request: OptimizationRequest) -> Dict:
        """
        Main optimization function using Google OR-Tools CP-SAT
        """
        self.model = cp_model.CpModel()
        
        # Extract data
        trains = {t.id: t for t in request.trains}
        stations = {s.id: s for s in request.stations}
        movements = request.movements
        
        # Time horizon (in minutes)
        horizon = request.time_horizon_hours * 60
        
        # Decision variables
        # departure_times[movement_idx] = actual departure time
        departure_times = {}
        # platform_assignments[movement_idx] = platform number
        platform_assignments = {}
        
        for i, movement in enumerate(movements):
            # Departure time variables
            min_departure = 0  # Start of horizon
            max_departure = horizon - 30  # Leave time for arrival
            
            departure_times[i] = self.model.NewIntVar(
                min_departure, max_departure, f'departure_{i}'
            )
            
            # Platform assignment
            station = stations[movement.from_station]
            platform_assignments[i] = self.model.NewIntVar(
                1, station.platforms, f'platform_{i}'
            )
        
        # Constraints
        self._add_platform_constraints(movements, departure_times, platform_assignments, stations)
        self._add_train_sequence_constraints(movements, departure_times, trains)
        
        # Objective: Minimize total delay and maximize throughput
        self._set_objective(movements, departure_times, trains)
        
        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        
        status = solver.Solve(self.model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return self._extract_solution(movements, departure_times, platform_assignments, solver)
        else:
            return {"status": "infeasible", "message": "No solution found"}
    
    def _add_platform_constraints(self, movements: List[TrainMovement], 
                                departure_times: Dict, platform_assignments: Dict,
                                stations: Dict[str, Station]):
        """
        Ensure no two trains use the same platform simultaneously
        """
        # Group movements by station
        station_movements = {}
        for i, movement in enumerate(movements):
            station_id = movement.from_station
            if station_id not in station_movements:
                station_movements[station_id] = []
            station_movements[station_id].append(i)
        
        # Add non-overlap constraints for each station
        for station_id, movement_indices in station_movements.items():
            for i in range(len(movement_indices)):
                for j in range(i + 1, len(movement_indices)):
                    idx1, idx2 = movement_indices[i], movement_indices[j]
                    
                    # If same platform, ensure no time overlap
                    same_platform = self.model.NewBoolVar(f'same_platform_{idx1}_{idx2}')
                    self.model.Add(platform_assignments[idx1] == platform_assignments[idx2]).OnlyEnforceIf(same_platform)
                    self.model.Add(platform_assignments[idx1] != platform_assignments[idx2]).OnlyEnforceIf(same_platform.Not())
                    
                    # Time separation when on same platform (15 minutes minimum)
                    time_separation = 15
                    self.model.Add(
                        departure_times[idx1] + time_separation <= departure_times[idx2]
                    ).OnlyEnforceIf(same_platform)
                    
                    self.model.Add(
                        departure_times[idx2] + time_separation <= departure_times[idx1]
                    ).OnlyEnforceIf(same_platform)
    
    def _add_train_sequence_constraints(self, movements: List[TrainMovement],
                                      departure_times: Dict, trains: Dict[str, Train]):
        """
        Ensure trains follow logical sequence (arrival before next departure)
        """
        # Group movements by train
        train_movements = {}
        for i, movement in enumerate(movements):
            train_id = movement.train_id
            if train_id not in train_movements:
                train_movements[train_id] = []
            train_movements[train_id].append(i)
        
        # Add sequence constraints
        for train_id, movement_indices in train_movements.items():
            movement_indices.sort(key=lambda x: movements[x].scheduled_departure)
            
            for i in range(len(movement_indices) - 1):
                current_idx = movement_indices[i]
                next_idx = movement_indices[i + 1]
                
                # Journey time + minimum turnaround
                journey_time = 60  # Assume 1 hour average journey
                turnaround_time = 20  # 20 minutes turnaround
                
                self.model.Add(
                    departure_times[next_idx] >= 
                    departure_times[current_idx] + journey_time + turnaround_time
                )
    
    def _set_objective(self, movements: List[TrainMovement], 
                      departure_times: Dict, trains: Dict[str, Train]):
        """
        Set optimization objective
        """
        objective_terms = []
        
        for i, movement in enumerate(movements):
            # Minimize delays (departure time vs scheduled)
            scheduled_minutes = movement.scheduled_departure.hour * 60 + movement.scheduled_departure.minute
            delay = departure_times[i] - scheduled_minutes
            
            # Weight by train priority
            train = trains[movement.train_id]
            weight = PRIORITY_WEIGHT.get(train.priority, 2)

            
            objective_terms.append(weight * delay)
        
        self.model.Minimize(sum(objective_terms))
    
    def _extract_solution(self, movements: List[TrainMovement], 
                         departure_times: Dict, platform_assignments: Dict,
                         solver: cp_model.CpSolver) -> Dict:
        """
        Extract solution from solved model
        """
        solution = {
            "status": "optimal",
            "objective_value": solver.ObjectiveValue(),
            "movements": []
        }
        
        for i, movement in enumerate(movements):
            departure_minutes = solver.Value(departure_times[i])
            platform = solver.Value(platform_assignments[i])
            
            # Convert minutes back to datetime
            base_time = movement.scheduled_departure.replace(hour=0, minute=0, second=0)
            actual_departure = base_time + timedelta(minutes=departure_minutes)
            
            solution_movement = {
                "train_id": movement.train_id,
                "from_station": movement.from_station,
                "to_station": movement.to_station,
                "scheduled_departure": movement.scheduled_departure.isoformat(),
                "optimized_departure": actual_departure.isoformat(),
                "platform": platform,
                "delay_minutes": departure_minutes - (movement.scheduled_departure.hour * 60 + movement.scheduled_departure.minute)
            }
            solution["movements"].append(solution_movement)
        
        return solution
```

### 2.6 Disruption Prediction Service (app/services/prediction.py)
```python
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta

class DisruptionPredictor:
    def __init__(self):
        self.model = self._create_model()
        self.features = ['weather_score', 'traffic_density', 'time_of_day', 
                        'day_of_week', 'historical_delays', 'train_priority']
    
    def _create_model(self):
        """Create a simple neural network for disruption prediction"""
        class DisruptionNet(nn.Module):
            def __init__(self, input_size=6):
                super(DisruptionNet, self).__init__()
                self.layers = nn.Sequential(
                    nn.Linear(input_size, 32),
                    nn.ReLU(),
                    nn.Dropout(0.2),
                    nn.Linear(32, 16),
                    nn.ReLU(),
                    nn.Linear(16, 1),
                    nn.Sigmoid()
                )
            
            def forward(self, x):
                return self.layers(x)
        
        model = DisruptionNet()
        # In a real implementation, load pre-trained weights
        return model
    
    def predict_disruptions(self, movements: List[Dict]) -> List[Dict]:
        """
        Predict probability of disruptions for each movement
        """
        predictions = []
        
        for movement in movements:
            features = self._extract_features(movement)
            
            # Convert to tensor
            feature_tensor = torch.FloatTensor(features).unsqueeze(0)
            
            # Make prediction
            with torch.no_grad():
                disruption_prob = self.model(feature_tensor).item()
            
            prediction = {
                "train_id": movement["train_id"],
                "from_station": movement["from_station"],
                "to_station": movement["to_station"],
                "disruption_probability": disruption_prob,
                "risk_level": self._classify_risk(disruption_prob),
                "predicted_delay_minutes": self._estimate_delay(disruption_prob),
                "recommendations": self._generate_recommendations(disruption_prob)
            }
            predictions.append(prediction)
        
        return predictions
    
    def _extract_features(self, movement: Dict) -> List[float]:
        """
        Extract features for prediction model
        """
        # Simulate feature extraction
        departure_time = datetime.fromisoformat(movement["scheduled_departure"])
        
        features = [
            np.random.uniform(0.3, 0.9),  # weather_score
            np.random.uniform(0.4, 0.8),  # traffic_density
            departure_time.hour / 24.0,   # time_of_day
            departure_time.weekday() / 7.0,  # day_of_week
            np.random.uniform(0.1, 0.6),  # historical_delays
            np.random.uniform(0.2, 1.0)   # train_priority
        ]
        
        return features
    
    def _classify_risk(self, probability: float) -> str:
        """Classify risk level based on probability"""
        if probability < 0.3:
            return "LOW"
        elif probability < 0.6:
            return "MEDIUM"
        else:
            return "HIGH"
    
    def _estimate_delay(self, probability: float) -> int:
        """Estimate potential delay based on disruption probability"""
        return int(probability * 45)  # Max 45 minutes delay
    
    def _generate_recommendations(self, probability: float) -> List[str]:
        """Generate recommendations based on prediction"""
        recommendations = []
        
        if probability > 0.7:
            recommendations.extend([
                "Consider alternative routing",
                "Allocate backup resources",
                "Notify passengers of potential delays"
            ])
        elif probability > 0.5:
            recommendations.extend([
                "Monitor closely",
                "Prepare contingency plans"
            ])
        else:
            recommendations.append("Normal monitoring")
        
        return recommendations
```

---

## Phase 3: Frontend Development

### 3.1 Frontend Project Structure
```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── api/
├── components/
│   ├── ui/
│   ├── dashboard/
│   │   ├── TrainMap.tsx
│   │   ├── MetricsPanel.tsx
│   │   ├── ScheduleTable.tsx
│   │   └── OptimizationPanel.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── api.ts
│   ├── types.ts
│   └── utils.ts
└── styles/
    └── globals.css
```

### 3.2 Type Definitions (lib/types.ts)
```typescript
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
```

### 3.3 API Client (lib/api.ts)
```typescript
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
```

### 3.4 Dashboard Main Page (app/dashboard/page.tsx)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Train, Station, TrainMovement, OptimizationResult, DisruptionPrediction } from '@/lib/types';
import { railwayApi } from '@/lib/api';
import TrainMap from '@/components/dashboard/TrainMap';
import MetricsPanel from '@/components/dashboard/MetricsPanel';
import ScheduleTable from '@/components/dashboard/ScheduleTable';
import OptimizationPanel from '@/components/dashboard/OptimizationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, RefreshCwIcon } from 'lucide-react';

export default function DashboardPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [movements, setMovements] = useState<TrainMovement[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [predictions, setPredictions] = useState<DisruptionPrediction[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    initializeData();
  }, []);

  // Live mode updates
  useEffect(() => {
    if (isLiveMode) {
      const unsubscribe = railwayApi.subscribeToUpdates((update) => {
        console.log('Real-time update:', update);
        // Handle real-time updates here
      });
      return unsubscribe;
    }
  }, [isLiveMode]);

  const initializeData = async () => {
    try {
      setLoading(true);
      const data = await railwayApi.generateData(8, 5);
      setTrains(data.trains);
      setStations(data.stations);
      setMovements(data.movements);
      
      // Get initial predictions
      const initialPredictions = await railwayApi.getPredictions(data.movements);
      setPredictions(initialPredictions);
    } catch (error) {
      console.error('Failed to initialize data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setIsOptimizing(true);
      const result = await railwayApi.optimizeSchedule({
        trains,
        stations,
        movements,
      });
      setOptimizationResult(result);
      
      if (result.status === 'optimal') {
        setMovements(result.movements);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCwIcon className="animate-spin h-8 w-8" />
        <span className="ml-2">Loading railway data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              IntelliRail Control Center
            </h1>
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleLiveMode}
                variant={isLiveMode ? "default" : "outline"}
                className="flex items-center"
              >
                {isLiveMode ? (
                  <PauseIcon className="w-4 h-4 mr-2" />
                ) : (
                  <PlayIcon className="w-4 h-4 mr-2" />
                )}
                {isLiveMode ? 'Live Mode' : 'Start Live'}
              </Button>
              <Button onClick={initializeData} variant="outline">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Metrics Row */}
        <MetricsPanel 
          trains={trains}
          movements={movements}
          predictions={predictions}
          optimizationResult={optimizationResult}
        />

        {/* Map and Optimization Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Railway Network Map</CardTitle>
              </CardHeader>
              <CardContent>
                <TrainMap 
                  trains={trains}
                  stations={stations}
                  movements={movements}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <OptimizationPanel 
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
              result={optimizationResult}
              predictions={predictions}
            />
          </div>
        </div>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle>Train Schedule & Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleTable 
              movements={movements}
              trains={trains}
              stations={stations}
              predictions={predictions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Phase 4: API Integration & Backend Routes

### 4.1 Main FastAPI Application (app/main.py)
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
import logging

from app.config import settings
from app.models.train import Train, Station, TrainMovement, OptimizationRequest
from app.services.optimization import RailwayOptimizer
from app.services.prediction import DisruptionPredictor
from app.utils.data_generator import RailwayDataGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliRail API",
    description="AI-Powered Railway Traffic Control System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_generator = RailwayDataGenerator()
optimizer = RailwayOptimizer()
predictor = DisruptionPredictor()

# Request/Response models
class DataGenerationRequest(BaseModel):
    train_count: int = 8
    station_count: int = 5

class PredictionRequest(BaseModel):
    movements: List[Dict]

@app.get("/")
async def root():
    return {
        "message": "IntelliRail API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/generate-data")
async def generate_railway_data(request: DataGenerationRequest):
    """Generate sample railway data for testing"""
    try:
        stations = data_generator.generate_stations(request.station_count)
        trains = data_generator.generate_trains(request.train_count)
        movements = data_generator.generate_movements(trains, stations)
        
        return {
            "stations": [station.dict() for station in stations],
            "trains": [train.dict() for train in trains],
            "movements": [movement.dict() for movement in movements]
        }
    except Exception as e:
        logger.error(f"Data generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data generation failed: {str(e)}")

@app.post("/api/optimize")
async def optimize_schedule(request: OptimizationRequest):
    """Optimize train schedule using AI algorithms"""
    try:
        logger.info(f"Starting optimization for {len(request.trains)} trains")
        result = optimizer.optimize_schedule(request)
        logger.info(f"Optimization completed with status: {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/api/predict-disruptions")
async def predict_disruptions(request: PredictionRequest):
    """Predict potential disruptions using ML models"""
    try:
        predictions = predictor.predict_disruptions(request.movements)
        return predictions
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/status")
async def get_system_status():
    """Get current system status and metrics"""
    return {
        "system_status": "operational",
        "active_trains": 8,
        "active_stations": 5,
        "optimization_engine": "online",
        "prediction_engine": "online",
        "last_optimization": "2025-01-01T10:30:00Z",
        "average_delay": 12.5,
        "throughput_efficiency": 85.2
    }

# WebSocket endpoint for real-time updates (placeholder)
@app.websocket("/ws/updates")
async def websocket_endpoint(websocket):
    await websocket.accept()
    try:
        while True:
            # Simulate real-time data
            data = {
                "timestamp": datetime.now().isoformat(),
                "type": "train_update",
                "train_id": "TRN_001",
                "status": "on_time"
            }
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
```

---

## Phase 5: Deployment & Testing

### 5.1 Environment Configuration
Create `.env` files for both backend and frontend:

**Backend .env:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/intellirail
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key_here
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
```

**Frontend .env.local:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=IntelliRail
```

### 5.2 Docker Configuration
**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "app.main"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/intellirail
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=intellirail
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 5.3 Running the Application
```bash
# Development mode
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python -m app.main

# Terminal 2 - Frontend
cd frontend
npm run dev

# Production mode with Docker
docker-compose up --build
```

### 5.4 Testing the System
Create test scripts to validate functionality:

**test_api.py:**
```python
import requests
import json

BASE_URL = "http://localhost:8000"

def test_generate_data():
    response = requests.post(f"{BASE_URL}/api/generate-data", 
                           json={"train_count": 5, "station_count": 3})
    assert response.status_code == 200
    data = response.json()
    assert len(data["trains"]) == 5
    assert len(data["stations"]) == 3
    return data

def test_optimization():
    # First generate data
    data = test_generate_data()
    
    # Then optimize
    response = requests.post(f"{BASE_URL}/api/optimize", json=data)
    assert response.status_code == 200
    result = response.json()
    assert "status" in result
    return result

def test_predictions():
    data = test_generate_data()
    response = requests.post(f"{BASE_URL}/api/predict-disruptions", 
                           json={"movements": data["movements"]})
    assert response.status_code == 200
    predictions = response.json()
    assert isinstance(predictions, list)
    return predictions

if __name__ == "__main__":
    print("Testing data generation...")
    test_generate_data()
    print("✓ Data generation test passed")
    
    print("Testing optimization...")
    test_optimization()
    print("✓ Optimization test passed")
    
    print("Testing predictions...")
    test_predictions()
    print("✓ Prediction test passed")
    
    print("All tests passed!")
```

---

## Phase 6: Demo Preparation

### 6.1 Demo Script
Create a compelling demo showcasing the system's capabilities:

1. **Live Data Visualization**: Show real-time train movements on the map
2. **Optimization in Action**: Demonstrate schedule optimization with before/after comparison
3. **Disruption Prediction**: Show ML predictions and recommendations
4. **Interactive Features**: Use the what-if simulator
5. **Metrics Dashboard**: Highlight improved throughput and reduced delays

### 6.2 Key Features to Highlight
- **Real-time processing** capabilities
- **AI-driven optimization** results
- **Intuitive dashboard** design  
- **Scalable architecture** potential
- **Integration readiness** with existing systems

This comprehensive guide provides everything needed to build a working prototype of the IntelliRail system for SIH 2025. The modular architecture allows for iterative development and easy expansion of features.