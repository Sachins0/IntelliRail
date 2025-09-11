'use client';

import React, { useState, useEffect } from 'react';
import { OptimizationResult } from '@/lib/types';
import { MessageCircle, Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface AIExplanation {
  train_id: string;
  primary_explanation: string;
  detailed_explanations: string[];
  decision_factors: string[];
  impact_explanation: string;
  confidence_score: number;
}

interface SystemSummary {
  performance_level: string;
  performance_description: string;
  key_insights: string[];
  recommendation: string;
  next_optimization_opportunity: string;
}

interface AIAssistantProps {
  optimizationResult: OptimizationResult | null;
  isVisible: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ optimizationResult, isVisible }) => {
  const [explanations, setExplanations] = useState<AIExplanation[]>([]);
  const [systemSummary, setSystemSummary] = useState<SystemSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<string>('');

  useEffect(() => {
    if (optimizationResult && isVisible) {
      generateExplanations();
    }
  }, [optimizationResult, isVisible]);

  const generateExplanations = async () => {
    if (!optimizationResult) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/explain-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimization_result: optimizationResult })
      });

      const data = await response.json();
      setExplanations(data.individual_explanations);
      setSystemSummary(data.system_summary);
    } catch (error) {
      console.error('Failed to generate explanations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'Excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Very Good': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'Good': return <MessageCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Brain className="w-6 h-6 text-purple-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">AI Assistant Explanations</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">Analyzing optimization decisions...</span>
        </div>
      ) : (
        <>
          {/* System Summary */}
          {systemSummary && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                {getPerformanceIcon(systemSummary.performance_level)}
                <h4 className="text-lg font-semibold ml-2">
                  System Performance: {systemSummary.performance_level}
                </h4>
              </div>
              
              <p className="text-gray-700 mb-4">{systemSummary.performance_description}</p>
              
              {/* Key Insights */}
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 mb-2">Key Insights:</h5>
                <ul className="space-y-1">
                  {systemSummary.key_insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-800 mb-2">💡 AI Recommendation:</h5>
                <p className="text-sm text-gray-700 mb-2">{systemSummary.recommendation}</p>
                <p className="text-xs text-gray-600">
                  <strong>Next Opportunity:</strong> {systemSummary.next_optimization_opportunity}
                </p>
              </div>
            </div>
          )}

          {/* Individual Train Explanations */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-800">Individual Decision Explanations:</h4>
            
            {/* Train Selector */}
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">View all trains</option>
              {explanations.map(exp => (
                <option key={exp.train_id} value={exp.train_id}>
                  {exp.train_id} - {exp.primary_explanation.slice(0, 50)}...
                </option>
              ))}
            </select>

            {/* Explanations List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {explanations
                .filter(exp => !selectedTrain || exp.train_id === selectedTrain)
                .map((explanation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-semibold text-gray-800">{explanation.train_id}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(explanation.confidence_score)}`}>
                      {Math.round(explanation.confidence_score * 100)}% confident
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Primary Explanation */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                      <p className="text-sm font-medium text-blue-900">Primary Decision:</p>
                      <p className="text-sm text-blue-800">{explanation.primary_explanation}</p>
                    </div>

                    {/* Impact Explanation */}
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                      <p className="text-sm font-medium text-green-900">Impact:</p>
                      <p className="text-sm text-green-800">{explanation.impact_explanation}</p>
                    </div>

                    {/* Decision Factors */}
                    {explanation.decision_factors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Decision Factors:</p>
                        <div className="flex flex-wrap gap-2">
                          {explanation.decision_factors.map((factor, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Explanations */}
                    {explanation.detailed_explanations.length > 1 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View detailed analysis ({explanation.detailed_explanations.length} factors)
                        </summary>
                        <ul className="mt-2 space-y-1 ml-4">
                          {explanation.detailed_explanations.slice(1).map((detail, idx) => (
                            <li key={idx} className="text-gray-600">• {detail}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
