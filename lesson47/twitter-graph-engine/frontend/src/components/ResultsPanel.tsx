import React from 'react';
import { AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResultsPanelProps {
  result: AnalysisResult;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  return (
    <div className="results-panel">
      <h2>Analysis Results</h2>
      
      <div className="results-grid">
        {result.communityCount !== undefined && (
          <div className="result-item">
            <span className="result-label">Communities:</span>
            <span className="result-value">{result.communityCount}</span>
          </div>
        )}

        {result.modularity !== undefined && (
          <div className="result-item">
            <span className="result-label">Modularity:</span>
            <span className="result-value">{result.modularity.toFixed(4)}</span>
          </div>
        )}

        {result.iterations !== undefined && (
          <div className="result-item">
            <span className="result-label">Iterations:</span>
            <span className="result-value">{result.iterations}</span>
          </div>
        )}

        <div className="result-item">
          <span className="result-label">Execution Time:</span>
          <span className="result-value">{result.executionTime}ms</span>
        </div>

        {result.edgeCut !== undefined && (
          <div className="result-item">
            <span className="result-label">Edge Cut:</span>
            <span className="result-value">{result.edgeCut}</span>
          </div>
        )}

        {result.balance !== undefined && (
          <div className="result-item">
            <span className="result-label">Balance:</span>
            <span className="result-value">{(result.balance * 100).toFixed(2)}%</span>
          </div>
        )}
      </div>

      {result.topInfluencers && result.topInfluencers.length > 0 && (
        <div className="top-influencers">
          <h3>Top Influencers</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={result.topInfluencers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="node" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rank" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {result.communities && result.communities.length > 0 && (
        <div className="community-distribution">
          <h3>Community Size Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={result.communities.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="size" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
