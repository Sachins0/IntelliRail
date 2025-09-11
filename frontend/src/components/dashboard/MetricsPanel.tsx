import React from 'react';
import { OptimizationResult } from '@/lib/types';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface MetricsPanelProps {
  result: OptimizationResult | null;
  isOptimized: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ result, isOptimized }) => {
  const metrics = result?.metrics || {
    total_delay_before: 0,
    total_delay_after: 0,
    improvement_percent: 0,
    conflicts_resolved: 0
  };

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
              {isOptimized ? `${metrics.improvement_percent}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Conflicts Resolved */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Conflicts Resolved</p>
            <p className="text-2xl font-bold text-purple-600">
              {isOptimized ? metrics.conflicts_resolved : 0}
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
