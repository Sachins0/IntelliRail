'use client';

import React, { useState, useEffect } from 'react';
import { Train, Station, TrainMovement, OptimizedMovement, OptimizationResult } from '@/lib/types';
import { railwayApi } from '@/lib/api';
import MetricsPanel from '@/components/dashboard/MetricsPanel';
import TrainTable from '@/components/dashboard/TrainTable';
import { PlayIcon, RefreshCwIcon, ZapIcon } from 'lucide-react';

export default function Dashboard() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [movements, setMovements] = useState<TrainMovement[]>([]);
  const [optimizedMovements, setOptimizedMovements] = useState<OptimizedMovement[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await railwayApi.getDemoData();
      setTrains(data.trains);
      setStations(data.stations);
      setMovements(data.movements);
      setIsOptimized(false);
      setOptimizationResult(null);
    } catch (err) {
      setError('Failed to load data. Make sure backend is running on http://localhost:8000');
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-xl text-gray-600">Loading IntelliRail System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚂 IntelliRail Control Center
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                AI-Powered Railway Traffic Optimization System
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={loadDemoData}
                disabled={isOptimizing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
              
              <button
                onClick={resetToOriginal}
                disabled={isOptimizing || !isOptimized}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Show Original
              </button>
              
              <button
                onClick={runOptimization}
                disabled={isOptimizing || trains.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <RefreshCwIcon className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <ZapIcon className="w-4 h-4 mr-2" />
                )}
                {isOptimizing ? 'Optimizing...' : 'Run AI Optimization'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Metrics */}
        <MetricsPanel result={optimizationResult} isOptimized={isOptimized} />

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Total Trains</h4>
            <p className="text-2xl font-bold text-blue-600">{trains.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900">Active Stations</h4>
            <p className="text-2xl font-bold text-green-600">{stations.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900">Total Movements</h4>
            <p className="text-2xl font-bold text-purple-600">{movements.length}</p>
          </div>
        </div>

        {/* Train Schedule Table */}
        <TrainTable
          trains={trains}
          stations={stations}
          movements={movements}
          optimizedMovements={optimizedMovements}
          isOptimized={isOptimized}
        />

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Optimization Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {optimizationResult.metrics.total_delay_before}
                </p>
                <p className="text-sm text-gray-500">Original Total Delays (min)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {optimizationResult.metrics.total_delay_after}
                </p>
                <p className="text-sm text-gray-500">Optimized Total Delays (min)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizationResult.metrics.improvement_percent}%
                </p>
                <p className="text-sm text-gray-500">Overall Improvement</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {optimizationResult.metrics.conflicts_resolved}
                </p>
                <p className="text-sm text-gray-500">Conflicts Resolved</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
