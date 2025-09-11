import React from 'react';
import { Train, TrainMovement, OptimizedMovement, Station } from '@/lib/types';

interface TrainTableProps {
  trains: Train[];
  stations: Station[];
  movements: TrainMovement[];
  optimizedMovements: OptimizedMovement[];
  isOptimized: boolean;
}

const TrainTable: React.FC<TrainTableProps> = ({ 
  trains, 
  stations, 
  movements, 
  optimizedMovements, 
  isOptimized 
}) => {
  const getStationName = (stationId: string) => {
    return stations.find(s => s.id === stationId)?.name || stationId;
  };

  const getTrainName = (trainId: string) => {
    return trains.find(t => t.id === trainId)?.name || trainId;
  };

  const getPriorityColor = (trainId: string) => {
    const train = trains.find(t => t.id === trainId);
    switch (train?.priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Train Schedule {isOptimized ? '(Optimized)' : '(Original)'}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Train
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departure Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delay (min)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(isOptimized ? optimizedMovements : movements).map((movement, index) => {
              const isOptimizedMovement = 'optimized_departure' in movement;
              const departure = isOptimizedMovement ? 
                movement.optimized_departure : movement.scheduled_departure_hour;
              const platform = isOptimizedMovement ? 
                movement.optimized_platform : movement.platform;
              const delay = isOptimizedMovement ? 
                movement.optimized_delay : movement.delay_minutes;
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getTrainName(movement.train_id)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {movement.train_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(movement.train_id)}`}>
                      {trains.find(t => t.id === movement.train_id)?.priority || 'MEDIUM'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getStationName(movement.from_station)} → {getStationName(movement.to_station)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {departure}:00
                    {isOptimizedMovement && movement.original_departure !== movement.optimized_departure && (
                      <span className="text-xs text-blue-600 ml-2">
                        (was {movement.original_departure}:00)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Platform {platform}
                    {isOptimizedMovement && movement.original_platform !== movement.optimized_platform && (
                      <span className="text-xs text-blue-600 ml-2">
                        (was {movement.original_platform})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${delay > 15 ? 'text-red-600' : delay > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {delay}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainTable;
