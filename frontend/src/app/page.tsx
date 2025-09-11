'use client';

import React, { useState, useEffect } from 'react';
import { Train, Station, TrainMovement, OptimizedMovement, OptimizationResult } from '@/lib/types';
import MetricsPanel from '@/components/MetricsPanel';
import TrainTable from '@/components/TrainTable';
import RailwayMap from '@/components/RailwayMap';
import AIAssistant from '@/components/AIAssistant';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import PerformanceCharts from '@/components/PerformanceCharts';
import { 
  PlayIcon, RefreshCwIcon, ZapIcon, BrainIcon, 
  BarChart3Icon, TestTubeIcon, EyeIcon 
} from 'lucide-react';
import { railwayApi } from '@/lib/api';

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  expected_improvement: string;
}

export default function FinalDashboard() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [movements, setMovements] = useState<TrainMovement[]>([]);
  const [optimizedMovements, setOptimizedMovements] = useState<OptimizedMovement[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
   const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  const [isSimulating, setIsSimulating] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState<string>('overview');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

useEffect(() => {
  console.log('Component mounted, starting initialization...');
  
  const initializeApp = async () => {
    try {
      await loadScenarios();
    } catch (error) {
      console.error('App initialization failed:', error);
      setError('Failed to initialize application');
      setLoading(false);
    }
  };
  
  // Start initialization
  initializeApp();
  
  // Emergency fallback timeout
  const emergencyTimeout = setTimeout(() => {
    console.warn('Emergency timeout triggered');
    setLoading(false);
    setError('Loading took too long. Some features may not work properly.');
  }, 20000); // 20 seconds
  
  return () => clearTimeout(emergencyTimeout);
}, []); // Empty dependency array is crucial



  const handleWhatIfScenario = async (whatIfData: any) => {
    try {
      setLoading(true);
      
      // Simulate what-if scenario
      const modifiedMovements = movements.map(movement => {
        let modifiedMovement = { ...movement };
        
        // Apply train delays
        if (whatIfData.changes.train_delays?.[movement.train_id]) {
          modifiedMovement.delay_minutes += whatIfData.changes.train_delays[movement.train_id];
        }
        
        // Apply weather impact
        if (whatIfData.changes.weather_impact) {
          modifiedMovement.delay_minutes += whatIfData.changes.weather_impact;
        }
        
        return modifiedMovement;
      });
      const response = await fetch('http://localhost:8000/api/advanced-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trains,
          stations,
          movements: modifiedMovements
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setOptimizedMovements(result.movements);
        setOptimizationResult(result);
        setIsOptimized(true);
        setActiveTab('overview'); // Switch to results view
      }
    } catch (error) {
      console.error('What-if scenario failed:', error);
    } finally {
      setLoading(false);
    }
  };

   // WebSocket connection for real-time updates
  useEffect(() => {
    if (isSimulating) {
      const ws = new WebSocket('ws://localhost:8000/ws/simulation');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setRealTimeUpdates(prev => [...prev.slice(-10), data]); // Keep last 10 updates
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsSimulating(false);
      };
      
      setWebSocket(ws);
      
      return () => {
        ws.close();
      };
    }
  }, [isSimulating]);

const loadScenarioData = async (scenarioType: string) => {
  try {
    console.log("Loading scenario:", scenarioType);
    setError(''); // Clear previous errors
    
    const response = await fetch('http://localhost:8000/api/generate-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_type: scenarioType })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load scenario`);
    }
    
    const data = await response.json();
    console.log("Scenario data loaded:", data);
    
    setTrains(data.trains || []);
    setStations(data.stations || []);
    setMovements(data.movements || []);
    setSelectedScenario(scenarioType);
    setIsOptimized(false);
    setOptimizationResult(null);
    
  } catch (err) {
    console.error('Scenario loading error:', err);
    setError(`Failed to load scenario: ${scenarioType}. ${err.message}`);
    
    // Set empty arrays to prevent crashes
    setTrains([]);
    setStations([]);
    setMovements([]);
  } finally {
    setLoading(false); // Always set loading to false
  }
};


const loadScenarios = async () => {
  try {
    console.log('Loading scenarios...');
    const response = await fetch('http://localhost:8000/api/scenarios');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Scenarios loaded:', data.scenarios);
    setScenarios(data.scenarios);
    
    // Load default scenario immediately
    if (data.scenarios.length > 0) {
      await loadScenarioData('normal');
    }
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    setError('Failed to connect to backend. Please ensure the server is running.');
    
    // Set fallback data to prevent infinite loading
    setScenarios([{
      id: 'normal',
      name: 'Demo Mode',
      description: 'Fallback demo data',
      difficulty: 'Easy',
      expected_improvement: '20%'
    }]);
    
    // Load some basic fallback data
    setTrains([]);
    setStations([]);
    setMovements([]);
  } finally {
    setLoading(false); // CRITICAL: Always set loading to false
  }
};

const runAdvancedOptimization = async () => {
  try {
    setIsOptimizing(true);
    setError('');
    if (!trains.length || !stations.length || !movements.length) {
      throw new Error('No data available. Load a scenario first.');
    }
    const res = await fetch('http://localhost:8000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trains, stations, movements })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const result = await res.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown optimization error');
    }
    setOptimizedMovements(result.movements || []);
    setOptimizationResult(result);
    setIsOptimized(true);
  } catch (e: any) {
    console.error('Advanced Optimization failed:', e);
    setError(`Advanced Optimization failed: ${e.message}`);
  } finally {
    setIsOptimizing(false);
  }
};



  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

    const tabs = [
    { id: 'overview', name: 'System Overview', icon: EyeIcon },
    { id: 'analytics', name: 'Performance Analytics', icon: BarChart3Icon },
    { id: 'assistant', name: 'AI Assistant', icon: BrainIcon },
    { id: 'whatif', name: 'What-If Scenarios', icon: TestTubeIcon },
  ];

  // const loadDemoData = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');
  //     const data = await railwayApi.getDemoData();
  //     setTrains(data.trains);
  //     setStations(data.stations);
  //     setMovements(data.movements);
  //     setIsOptimized(false);
  //     setOptimizationResult(null);
  //   } catch (err) {
  //     setError('Failed to load data. Make sure backend is running on http://localhost:8000');
  //     console.error('Data loading error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const runOptimization = async () => {
    try {
      setIsOptimizing(true);
      setError('');
      
      const result = await railwayApi.optimize({
        trains,
        stations,
        movements
      });

      if (result.status === 'success') {
        setOptimizedMovements(result.movements);
        setOptimizationResult(result);
        setIsOptimized(true);
      } else {
        setError(`Optimization failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Optimization failed. Check backend connection.');
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const resetToOriginal = () => {
    setIsOptimized(false);
    setOptimizationResult(null);
    setOptimizedMovements([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Initializing IntelliRail V2.0...</p>
        </div>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-gray-50">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                🚂 IntelliRail V2.0
              </h1>
              <p className="text-xl opacity-90">
                Advanced AI-Powered Railway Traffic Control System
              </p>
              <div className="flex items-center mt-2 space-x-4 text-sm opacity-80">
                <span>🤖 Multi-Objective AI</span>
                <span>⚡ Real-time Optimization</span>
                <span>🎯 Predictive Analytics</span>
                <span>💬 Explainable AI</span>
              </div>
            </div>
            
            {/* Enhanced Control Panel */}
            <div className="flex space-x-4">
              {/* Scenario Selector */}
              <select
                value={selectedScenario}
                onChange={(e) => loadScenarioData(e.target.value)}
                disabled={isOptimizing || loading}
                className="px-4 py-2 bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                {scenarios.map(scenario => (
                  <option key={scenario.id} value={scenario.id} className="text-gray-900">
                    {scenario.name} ({scenario.difficulty})
                  </option>
                ))}
              </select>

              <button
                onClick={toggleSimulation}
                disabled={isOptimizing}
                className={`inline-flex items-center px-6 py-2 border border-white border-opacity-30 rounded-lg shadow-sm text-sm font-medium text-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 transition-all`}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {isSimulating ? 'Stop Live Mode' : 'Start Live Mode'}
              </button>
              
              <button
                onClick={runAdvancedOptimization}
                disabled={isOptimizing || trains.length === 0}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transform hover:scale-105 transition-all"
              >
                {isOptimizing ? (
                  <RefreshCwIcon className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <ZapIcon className="w-4 h-4 mr-2" />
                )}
                {isOptimizing ? 'AI Optimizing...' : 'Run Advanced AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Current Scenario Info Banner */}
        {scenarios.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-blue-900">
                  Active Scenario: {scenarios.find(s => s.id === selectedScenario)?.name}
                </h4>
                <p className="text-blue-700 mt-1">
                  {scenarios.find(s => s.id === selectedScenario)?.description}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-blue-600">
                  <span>Difficulty: {scenarios.find(s => s.id === selectedScenario)?.difficulty}</span>
                  <span>Expected: {scenarios.find(s => s.id === selectedScenario)?.expected_improvement}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isSimulating ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isSimulating ? '🟢 Live Mode Active' : '⚪ Static Mode'}
                  </span>
                </div>
              </div>
              {optimizationResult && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {optimizationResult.advanced_metrics?.improvement_percent || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Performance Gain</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Panel */}
            <MetricsPanel 
              result={optimizationResult} 
              isOptimized={isOptimized}
              movements={movements}        // Add this line
              stations={stations}          // Add this line
            />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Railway Network Map */}
              <div className="lg:col-span-1">
                <RailwayMap
                  trains={trains}
                  stations={stations}
                  movements={movements}
                  optimizedMovements={optimizedMovements}
                  isOptimized={isOptimized}
                  isSimulating={isSimulating}
                />
              </div>

              {/* Real-time Updates Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">System Status & Updates</h3>
                    <div className={`flex items-center space-x-2 ${
                      isSimulating ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        isSimulating ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {isSimulating ? 'Live Updates' : 'Static Mode'}
                      </span>
                    </div>
                  </div>
                  
                  {/* System Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{trains.length}</div>
                      <div className="text-sm text-blue-800">Active Trains</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stations.length}</div>
                      <div className="text-sm text-green-800">Network Stations</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{movements.length}</div>
                      <div className="text-sm text-purple-800">Scheduled Movements</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {optimizationResult?.advanced_metrics?.conflicts_resolved || 0}
                      </div>
                      <div className="text-sm text-orange-800">Conflicts Resolved</div>
                    </div>
                  </div>

                  {/* Recent Updates */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <h4 className="font-medium text-gray-800">Recent Updates:</h4>
                    {realTimeUpdates.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        {isSimulating ? 'Waiting for live updates...' : 'Enable live mode for real-time updates'}
                      </p>
                    ) : (
                      realTimeUpdates.slice(-5).reverse().map((update, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-3 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                🚂 {update.data.train_id}: {update.data.status.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-xs text-blue-700">
                                📍 {update.data.current_station} • ⏱️ Delay: {update.data.delay_minutes}min • 🚄 Speed: {Math.round(update.data.speed_kmh)}km/h
                              </p>
                            </div>
                            <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
                              {new Date(update.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Train Schedule Table */}
            <TrainTable
              trains={trains}
              stations={stations}
              movements={movements}
              optimizedMovements={optimizedMovements}
              isOptimized={isOptimized}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <PerformanceCharts
            optimizationResult={optimizationResult}
            trains={trains}
            originalMovements={movements}
          />
        )}

        {activeTab === 'assistant' && (
          <AIAssistant
            optimizationResult={optimizationResult}
            isVisible={true}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulator
            trains={trains}
            stations={stations}
            movements={movements}
            onRunWhatIf={handleWhatIfScenario}
          />
        )}
      </div>
    </div>
  );
}