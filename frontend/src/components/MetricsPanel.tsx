import React from 'react';
import { OptimizationResult, TrainMovement, Station } from '@/lib/types';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricsPanelProps {
  result: OptimizationResult | null;
  isOptimized: boolean;
  movements: TrainMovement[]; // Add this prop
  stations: Station[];        // Add this prop
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  result, 
  isOptimized, 
  movements,
  stations 
}) => {
  // Calculate initial metrics from raw data
  const calculateInitialMetrics = () => {
    const totalDelayBefore = movements?.reduce((sum, movement) => sum + (movement.delay_minutes || 0), 0);
    
    // Calculate platform conflicts
    const conflictCount = calculatePlatformConflicts(movements, stations);
    
    return {
      total_delay_before: totalDelayBefore,
      total_delay_after: totalDelayBefore,
      improvement_percent: 0,
      conflicts_resolved: 0,
      initial_conflicts: conflictCount
    };
  };

  // Calculate platform conflicts with better logic
const calculatePlatformConflicts = (movements: TrainMovement[], stations: Station[]) => {
  let conflicts = 0;
  
  // Group movements by station
  const stationGroups: { [stationId: string]: TrainMovement[] } = {};
  movements?.forEach(movement => {
    if (!stationGroups[movement.from_station]) {
      stationGroups[movement.from_station] = [];
    }
    stationGroups[movement.from_station].push(movement);
  });
  
  // Check conflicts within each station
  Object.entries(stationGroups).forEach(([stationId, stationMovements]) => {
    // Check every pair of movements at this station
    for (let i = 0; i < stationMovements.length; i++) {
      for (let j = i + 1; j < stationMovements.length; j++) {
        const movement1 = stationMovements[i];
        const movement2 = stationMovements[j];
        
        // Same platform check
        if (movement1.platform === movement2.platform) {
          // Calculate actual departure times including delays
          const departure1 = movement1.scheduled_departure_hour + (movement1.delay_minutes / 60);
          const departure2 = movement2.scheduled_departure_hour + (movement2.delay_minutes / 60);
          
          // Check if departures are within 1 hour of each other (potential conflict)
          if (Math.abs(departure1 - departure2) <= 1.0) {
            conflicts++;
          }
        }
        
        // Also check platform capacity conflicts (multiple trains departing same hour)
        if (movement1.scheduled_departure_hour === movement2.scheduled_departure_hour) {
          const station = stations.find(s => s.id === stationId);
          if (station) {
            // Count trains departing this hour from this station
            const sameHourCount = stationMovements.filter(m => 
              m.scheduled_departure_hour === movement1.scheduled_departure_hour
            ).length;
            
            // If more trains than platforms, it's a capacity conflict
            if (sameHourCount > station.platforms) {
              conflicts++; // Only count once per hour per station
              break; // Don't double count for this hour
            }
          }
        }
      }
    }
  });
  
  return conflicts;
};


  // Get metrics to display
  const metrics = isOptimized && result?.metrics 
    ? result.metrics 
    : calculateInitialMetrics();

    console.log("metrics", metrics);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Delays */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Delays</p>
            <p className="text-2xl font-bold text-gray-900">
              {isOptimized ? metrics.total_delay_after : metrics.total_delay_before} min
            </p>
            {isOptimized && metrics.total_delay_before !== metrics.total_delay_after && (
              <p className="text-xs text-gray-500">
                (was {metrics.total_delay_before} min)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Improvement */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Improvement</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.improvement_percent || 0}%
            </p>
            {isOptimized && (
              <p className="text-xs text-gray-500">
                {Math.round(metrics.total_delay_before - metrics.total_delay_after)} min saved
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conflicts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">
              {isOptimized ? 'Conflicts Resolved' : 'Platform Conflicts'}
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {isOptimized ? (metrics.conflicts_resolved || 0) : (metrics.initial_conflicts || 0)}
            </p>
            {isOptimized && metrics.initial_conflicts && (
              <p className="text-xs text-gray-500">
                of {metrics.initial_conflicts} total
              </p>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-2xl font-bold text-gray-900">
              {isOptimized ? 'Optimized' : 'Original'}
            </p>
            {isOptimized && (
              <p className="text-xs text-green-600">AI Enhanced</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
