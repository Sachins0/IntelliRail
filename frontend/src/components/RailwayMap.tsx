'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Train, Station, TrainMovement, OptimizedMovement } from '@/lib/types';

interface RailwayMapProps {
  trains: Train[];
  stations: Station[];
  movements: TrainMovement[];
  optimizedMovements: OptimizedMovement[];
  isOptimized: boolean;
  isSimulating: boolean;
}

interface TrainPosition {
  id: string;
  x: number;
  y: number;
  fromStation: string;
  toStation: string;
  progress: number; // 0 to 1
  status: 'on_time' | 'delayed' | 'optimized';
}

const RailwayMap: React.FC<RailwayMapProps> = ({
  trains, stations, movements, optimizedMovements, isOptimized, isSimulating
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [trainPositions, setTrainPositions] = useState<TrainPosition[]>([]);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Map dimensions
  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 600;
  const STATION_RADIUS = 25;

  // Generate station positions in a network layout
  const getStationPosition = (index: number, total: number) => {
    const centerX = MAP_WIDTH / 2;
    const centerY = MAP_HEIGHT / 2;
    const radius = Math.min(MAP_WIDTH, MAP_HEIGHT) * 0.3;
    
    const angle = (2 * Math.PI * index) / total;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Station positions
  const stationPositions = stations.map((station, index) => ({
    ...station,
    ...getStationPosition(index, stations.length)
  }));

  // Initialize train positions
  useEffect(() => {
    const currentMovements = isOptimized ? optimizedMovements : movements;
    const initialPositions: TrainPosition[] = currentMovements.map(movement => {
      const fromStation = stationPositions.find(s => s.id === movement.from_station);
      const toStation = stationPositions.find(s => s.id === movement.to_station);
      
      return {
        id: movement.train_id,
        x: fromStation?.x || 0,
        y: fromStation?.y || 0,
        fromStation: movement.from_station,
        toStation: movement.to_station,
        progress: 0,
        status: isOptimized ? 'optimized' : 
                (movement.delay_minutes > 15 ? 'delayed' : 'on_time')
      };
    });
    
    setTrainPositions(initialPositions);
  }, [stations, movements, optimizedMovements, isOptimized]);

  // Animation loop for moving trains
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      setTrainPositions(positions => positions.map(pos => {
        const fromStation = stationPositions.find(s => s.id === pos.fromStation);
        const toStation = stationPositions.find(s => s.id === pos.toStation);
        
        if (!fromStation || !toStation) return pos;

        let newProgress = pos.progress + 0.02; // Speed of animation
        
        if (newProgress >= 1) {
          // Train reached destination - start next journey or reset
          newProgress = 0;
          // In a real system, this would move to the next movement
        }

        const x = fromStation.x + (toStation.x - fromStation.x) * newProgress;
        const y = fromStation.y + (toStation.y - fromStation.y) * newProgress;

        return { ...pos, x, y, progress: newProgress };
      }));
    }, 100); // 10 FPS

    return () => clearInterval(interval);
  }, [isSimulating, stationPositions]);

  const getTrainColor = (status: string) => {
    switch (status) {
      case 'delayed': return '#ef4444'; // red
      case 'optimized': return '#10b981'; // green
      case 'on_time': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const getPlatformColor = (platformCount: number, occupancy: number) => {
    const ratio = occupancy / platformCount;
    if (ratio > 0.8) return '#ef4444'; // high occupancy - red
    if (ratio > 0.5) return '#f59e0b'; // medium occupancy - yellow
    return '#10b981'; // low occupancy - green
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Railway Network Overview</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">On Time</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Delayed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Optimized</span>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="border rounded bg-gradient-to-br from-blue-50 to-indigo-100"
      >
        {/* Railway tracks between stations */}
        {stationPositions.map((station1, i) => 
          stationPositions.slice(i + 1).map((station2, j) => (
            <line
              key={`track-${i}-${j}`}
              x1={station1.x}
              y1={station1.y}
              x2={station2.x}
              y2={station2.y}
              stroke="#e5e7eb"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          ))
        )}

        {/* Stations */}
        {stationPositions.map((station, index) => {
          // Calculate platform occupancy (simplified)
          const occupancy = Math.floor(Math.random() * station.platforms);
          
          return (
            <g key={station.id}>
              {/* Station circle */}
              <circle
                cx={station.x}
                cy={station.y}
                r={STATION_RADIUS}
                fill={getPlatformColor(station.platforms, occupancy)}
                stroke="#374151"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
              
              {/* Station label */}
              <text
                x={station.x}
                y={station.y - STATION_RADIUS - 10}
                textAnchor="middle"
                className="text-sm font-semibold fill-gray-800"
              >
                {station.name}
              </text>
              
              {/* Platform count */}
              <text
                x={station.x}
                y={station.y + 5}
                textAnchor="middle"
                className="text-xs fill-white font-medium"
              >
                {station.platforms}P
              </text>
              
              {/* Occupancy indicator */}
              <text
                x={station.x}
                y={station.y + STATION_RADIUS + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {occupancy}/{station.platforms}
              </text>
            </g>
          );
        })}

        {/* Trains */}
        {trainPositions.map(train => (
          <g key={train.id}>
            {/* Train body */}
            <rect
              x={train.x - 8}
              y={train.y - 4}
              width="16"
              height="8"
              rx="2"
              fill={getTrainColor(train.status)}
              className="drop-shadow-md"
            />
            
            {/* Train ID */}
            <text
              x={train.x}
              y={train.y - 10}
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-800"
            >
              {train.id.replace('TRN_', '')}
            </text>
          </g>
        ))}

        {/* Status indicators */}
        <g>
          <rect x="20" y="20" width="200" height="80" fill="rgba(255,255,255,0.9)" rx="5" />
          <text x="30" y="40" className="text-sm font-semibold fill-gray-800">
            Network Status
          </text>
          <text x="30" y="60" className="text-xs fill-gray-600">
            Active Trains: {trainPositions.length}
          </text>
          <text x="30" y="75" className="text-xs fill-gray-600">
            Mode: {isOptimized ? 'AI Optimized' : 'Original Schedule'}
          </text>
          <text x="30" y="90" className="text-xs fill-gray-600">
            Animation: {isSimulating ? 'Running' : 'Paused'}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default RailwayMap;
