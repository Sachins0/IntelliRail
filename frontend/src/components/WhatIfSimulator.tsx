'use client';

import React, { useState } from 'react';
import { Train, Station, TrainMovement } from '@/lib/types';
import { PlayIcon, RotateCcwIcon, SettingsIcon } from 'lucide-react';

interface WhatIfProps {
  trains: Train[];
  stations: Station[];
  movements: TrainMovement[];
  onRunWhatIf: (scenario: any) => void;
}

interface WhatIfScenario {
  name: string;
  description: string;
  changes: {
    train_delays?: { [trainId: string]: number };
    station_closures?: string[];
    weather_impact?: number;
    priority_changes?: { [trainId: string]: string };
  };
}

const WhatIfSimulator: React.FC<WhatIfProps> = ({ trains, stations, movements, onRunWhatIf }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customChanges, setCustomChanges] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  const predefinedScenarios: WhatIfScenario[] = [
    {
      name: "Major Train Breakdown",
      description: "Simulate a 2-hour delay for the highest priority train",
      changes: {
        train_delays: { [trains.find(t => t.priority.value === 3)?.id || 'TRN_001']: 120 }
      }
    },
    {
      name: "Station Platform Closure",
      description: "Reduce platform capacity at the busiest station by 50%",
      changes: {
        station_closures: [stations.reduce((max, station) => 
          station.platforms > max.platforms ? station : max, stations[0])?.id || 'STN_001']
      }
    },
    {
      name: "Weather Disruption",
      description: "Add 15-30 minute delays to all trains due to heavy rain",
      changes: {
        weather_impact: 25
      }
    },
    {
      name: "Priority Shuffle",
      description: "Change priorities of random trains to test flexibility",
      changes: {
        priority_changes: Object.fromEntries(
          trains.slice(0, 3).map(t => [t.id, t.priority.value === 3 ? 'MEDIUM' : 'HIGH'])
        )
      }
    },
    {
      name: "Peak Hour Rush",
      description: "Simulate 50% more trains during peak hours",
      changes: {
        train_delays: Object.fromEntries(
          trains.map(t => [t.id, Math.random() > 0.5 ? Math.floor(Math.random() * 30) : 0])
        )
      }
    }
  ];

  const runWhatIfScenario = async () => {
    if (!selectedScenario && Object.keys(customChanges).length === 0) {
      alert('Please select a scenario or make custom changes');
      return;
    }

    setIsRunning(true);
    
    try {
      const scenario = predefinedScenarios.find(s => s.name === selectedScenario);
      const whatIfData = {
        scenario_name: selectedScenario || 'Custom Scenario',
        base_data: { trains, stations, movements },
        changes: scenario?.changes || customChanges
      };

      await onRunWhatIf(whatIfData);
    } catch (error) {
      console.error('What-if simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetScenario = () => {
    setSelectedScenario('');
    setCustomChanges({});
  };

  const handleTrainDelayChange = (trainId: string, delay: number) => {
    setCustomChanges(prev => ({
      ...prev,
      train_delays: { ...prev.train_delays, [trainId]: delay }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <SettingsIcon className="w-6 h-6 text-orange-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">What-If Scenario Simulator</h3>
      </div>

      {/* Predefined Scenarios */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Predefined Scenarios:</h4>
        <div className="grid gap-3">
          {predefinedScenarios.map((scenario, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedScenario === scenario.name
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
              }`}
              onClick={() => setSelectedScenario(scenario.name)}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={selectedScenario === scenario.name}
                  onChange={() => setSelectedScenario(scenario.name)}
                  className="mt-1 mr-3 text-orange-500"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800">{scenario.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scenario Builder */}
      <div className="mb-6 border-t pt-6">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Custom Scenario Builder:</h4>
        
        {/* Individual Train Delays */}
        <div className="mb-4">
          <h5 className="font-medium text-gray-700 mb-2">Individual Train Delays (minutes):</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trains.slice(0, 6).map(train => (
              <div key={train.id} className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 flex-1">{train.id}:</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  placeholder="0"
                  value={customChanges.train_delays?.[train.id] || ''}
                  onChange={(e) => handleTrainDelayChange(train.id, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Weather Impact */}
        <div className="mb-4">
          <h5 className="font-medium text-gray-700 mb-2">Weather Impact (additional delay for all trains):</h5>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0"
              max="60"
              value={customChanges.weather_impact || 0}
              onChange={(e) => setCustomChanges(prev => ({ ...prev, weather_impact: parseInt(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-20">
              {customChanges.weather_impact || 0} minutes
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={runWhatIfScenario}
          disabled={isRunning || (!selectedScenario && Object.keys(customChanges).length === 0)}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Simulation...
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 mr-2" />
              Run What-If Analysis
            </>
          )}
        </button>

        <button
          onClick={resetScenario}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RotateCcwIcon className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>

      {/* Current Scenario Display */}
      {(selectedScenario || Object.keys(customChanges).length > 0) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-800 mb-2">Current What-If Configuration:</h5>
          <div className="text-sm text-gray-600 space-y-1">
            {selectedScenario && (
              <div>• <strong>Predefined Scenario:</strong> {selectedScenario}</div>
            )}
            {customChanges.train_delays && Object.keys(customChanges.train_delays).length > 0 && (
              <div>• <strong>Custom Train Delays:</strong> {Object.keys(customChanges.train_delays).length} trains affected</div>
            )}
            {customChanges.weather_impact && (
              <div>• <strong>Weather Impact:</strong> +{customChanges.weather_impact} minutes for all trains</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulator;
