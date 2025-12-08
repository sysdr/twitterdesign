import React, { useState } from 'react';

interface ControlPanelProps {
  onGenerateGraph: (type: string, nodeCount: number, avgDegree: number, communityCount?: number) => void;
  onAnalysis: (type: string, params?: any) => void;
  loading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerateGraph, onAnalysis, loading }) => {
  const [graphType, setGraphType] = useState('scale-free');
  const [nodeCount, setNodeCount] = useState(1000);
  const [avgDegree, setAvgDegree] = useState(10);
  const [communityCount, setCommunityCount] = useState(5);
  const [numPartitions, setNumPartitions] = useState(4);

  return (
    <div className="control-panel">
      <h2>Graph Generation</h2>
      
      <div className="control-group">
        <label>Graph Type:</label>
        <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
          <option value="scale-free">Scale-Free (Power Law)</option>
          <option value="community">Community Structure</option>
          <option value="small-world">Small-World</option>
        </select>
      </div>

      <div className="control-group">
        <label>Nodes: {nodeCount}</label>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={nodeCount}
          onChange={(e) => setNodeCount(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Avg Degree: {avgDegree}</label>
        <input
          type="range"
          min="2"
          max="50"
          value={avgDegree}
          onChange={(e) => setAvgDegree(Number(e.target.value))}
        />
      </div>

      {graphType === 'community' && (
        <div className="control-group">
          <label>Communities: {communityCount}</label>
          <input
            type="range"
            min="2"
            max="20"
            value={communityCount}
            onChange={(e) => setCommunityCount(Number(e.target.value))}
          />
        </div>
      )}

      <button
        className="btn-primary"
        onClick={() => onGenerateGraph(graphType, nodeCount, avgDegree, communityCount)}
        disabled={loading}
      >
        Generate Graph
      </button>

      <hr />

      <h2>Graph Analysis</h2>

      <button
        className="btn-secondary"
        onClick={() => onAnalysis('communities')}
        disabled={loading}
      >
        🔍 Detect Communities (LPA)
      </button>

      <button
        className="btn-secondary"
        onClick={() => onAnalysis('pagerank')}
        disabled={loading}
      >
        ⭐ Compute PageRank
      </button>

      <div className="control-group">
        <label>Partitions: {numPartitions}</label>
        <input
          type="range"
          min="2"
          max="16"
          value={numPartitions}
          onChange={(e) => setNumPartitions(Number(e.target.value))}
        />
      </div>

      <button
        className="btn-secondary"
        onClick={() => onAnalysis('partition', { numPartitions, method: 'hash' })}
        disabled={loading}
      >
        ✂️ Partition Graph
      </button>
    </div>
  );
};
