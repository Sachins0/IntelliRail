'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { OptimizationResult, Train, TrainMovement } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PerformanceChartsProps {
  optimizationResult: OptimizationResult | null;
  trains: Train[];
  originalMovements: TrainMovement[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  optimizationResult,
  trains,
  originalMovements
}) => {
  if (!optimizationResult) return null;

  // Delay Comparison Chart Data
  const delayComparisonData = {
    labels: optimizationResult.movements.map(m => m.train_id.replace('TRN_', 'Train ')),
    datasets: [
      {
        label: 'Original Delays',
        data: optimizationResult.movements.map(m => m.original_delay),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Optimized Delays',
        data: optimizationResult.movements.map(m => m.optimized_delay),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  // Platform Utilization Data
  const platformChanges = optimizationResult.movements.filter(
    m => m.original_platform !== m.optimized_platform
  ).length;
  const noChanges = optimizationResult.movements.length - platformChanges;
  
  const platformUtilizationData = {
    labels: ['Platform Changes', 'No Changes'],
    datasets: [
      {
        data: [platformChanges, noChanges],
        backgroundColor: ['#f59e0b', '#6b7280'],
        borderWidth: 2,
      },
    ],
  };

  // Time Distribution Chart
  const timeDistributionData = {
    labels: ['6-9 AM', '9-12 PM', '12-3 PM', '3-6 PM', '6-9 PM'],
    datasets: [
      {
        label: 'Original Schedule',
        data: [
          originalMovements.filter(m => m.scheduled_departure_hour >= 6 && m.scheduled_departure_hour < 9).length,
          originalMovements.filter(m => m.scheduled_departure_hour >= 9 && m.scheduled_departure_hour < 12).length,
          originalMovements.filter(m => m.scheduled_departure_hour >= 12 && m.scheduled_departure_hour < 15).length,
          originalMovements.filter(m => m.scheduled_departure_hour >= 15 && m.scheduled_departure_hour < 18).length,
          originalMovements.filter(m => m.scheduled_departure_hour >= 18 && m.scheduled_departure_hour < 21).length,
        ],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Optimized Schedule',
        data: [
          optimizationResult.movements.filter(m => m.optimized_departure >= 6 && m.optimized_departure < 9).length,
          optimizationResult.movements.filter(m => m.optimized_departure >= 9 && m.optimized_departure < 12).length,
          optimizationResult.movements.filter(m => m.optimized_departure >= 12 && m.optimized_departure < 15).length,
          optimizationResult.movements.filter(m => m.optimized_departure >= 15 && m.optimized_departure < 18).length,
          optimizationResult.movements.filter(m => m.optimized_departure >= 18 && m.optimized_departure < 21).length,
        ],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Analytics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Comparison */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Delay Comparison by Train</h4>
          <Bar data={delayComparisonData} options={chartOptions} />
        </div>

        {/* Platform Changes */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Platform Optimization</h4>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={platformUtilizationData} options={doughnutOptions} />
          </div>
        </div>

        {/* Time Distribution */}
        <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Schedule Distribution Throughout Day</h4>
          <Line data={timeDistributionData} options={chartOptions} />
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {optimizationResult.advanced_metrics?.improvement_percent || 0}%
          </div>
          <div className="text-sm text-blue-800">Overall Improvement</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {optimizationResult.movements.filter(m => m.delay_reduction > 0).length}
          </div>
          <div className="text-sm text-green-800">Trains Improved</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {platformChanges}
          </div>
          <div className="text-sm text-yellow-800">Platform Changes</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round((optimizationResult.advanced_metrics?.solving_time_ms || 0) / 1000)}s
          </div>
          <div className="text-sm text-purple-800">Solution Time</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
