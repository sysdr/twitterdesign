import React, { useState, useEffect } from 'react';
import { graphAPI, connectWebSocket } from '../services/api';
import { GraphMetrics, AnalysisResult, GraphData } from '../types';
import { GraphVisualization } from './GraphVisualization';
import { MetricsDisplay } from './MetricsDisplay';
import { ControlPanel } from './ControlPanel';
import { ResultsPanel } from './ResultsPanel';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    const ws = connectWebSocket((data) => {
      console.log('WebSocket message:', data.type);
      
      if (data.type === 'graph-generated') {
        setMetrics(data.data.metrics);
        setGraphData(data.data.graphData);
        setStatus('Graph generated successfully');
      } else if (data.type === 'communities-detected') {
        setAnalysisResult({
          communityCount: data.data.result.communities.size,
          modularity: data.data.result.modularity,
          iterations: data.data.result.iterations,
          executionTime: data.data.result.executionTime,
          communities: data.data.communityData
        });
        setStatus('Communities detected');
      } else if (data.type === 'pagerank-computed') {
        setAnalysisResult({
          iterations: data.data.result.iterations,
          convergence: data.data.result.convergence,
          executionTime: data.data.result.executionTime,
          topInfluencers: data.data.result.topInfluencers
        });
        setStatus('PageRank computed');
      } else if (data.type === 'graph-partitioned') {
        let partitionSizes: [number, number][] = [];
        if (data.data.partitionSizes) {
          if (Array.isArray(data.data.partitionSizes)) {
            // Already an array (from HTTP response)
            partitionSizes = data.data.partitionSizes;
          } else if (data.data.partitionSizes.entries && typeof data.data.partitionSizes.entries === 'function') {
            // It's a Map object
            partitionSizes = Array.from(data.data.partitionSizes.entries());
          } else {
            // It's a plain object (from WebSocket JSON serialization)
            partitionSizes = Object.entries(data.data.partitionSizes).map(([k, v]) => [Number(k), Number(v)]) as [number, number][];
          }
        }
        setAnalysisResult({
          edgeCut: data.data.result.edgeCut,
          balance: data.data.result.balance,
          executionTime: data.data.result.executionTime,
          partitionSizes: partitionSizes
        });
        setStatus('Graph partitioned');
      }
    });

    return () => ws.close();
  }, []);

  const handleGenerateGraph = async (type: string, nodeCount: number, avgDegree: number, communityCount?: number) => {
    setLoading(true);
    setStatus('Generating graph...');
    try {
      const result = await graphAPI.generateGraph(type, nodeCount, avgDegree, communityCount);
      setMetrics(result.metrics);
      const data = await graphAPI.getGraphData();
      setGraphData(data);
      setStatus('Graph generated successfully');
    } catch (error) {
      setStatus('Error generating graph');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async (analysisType: string, params?: any) => {
    setLoading(true);
    setStatus(`Running ${analysisType}...`);
    try {
      let result;
      if (analysisType === 'communities') {
        result = await graphAPI.detectCommunities();
      } else if (analysisType === 'pagerank') {
        result = await graphAPI.computePageRank(params?.personalized, params?.sourceNodes);
      } else if (analysisType === 'partition') {
        result = await graphAPI.partitionGraph(params?.numPartitions || 4, params?.method);
      }
      
      setAnalysisResult(result);
      setStatus(`${analysisType} completed`);
    } catch (error) {
      setStatus(`Error running ${analysisType}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🔗 Twitter Graph Algorithm Engine</h1>
        <div className="status-bar">
          <span className={loading ? 'status loading' : 'status'}>{status}</span>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="left-panel">
          <ControlPanel 
            onGenerateGraph={handleGenerateGraph}
            onAnalysis={handleAnalysis}
            loading={loading}
          />
          {metrics && <MetricsDisplay metrics={metrics} />}
          {analysisResult && <ResultsPanel result={analysisResult} />}
        </div>

        <div className="right-panel">
          {graphData && <GraphVisualization data={graphData} />}
        </div>
      </div>
    </div>
  );
};
