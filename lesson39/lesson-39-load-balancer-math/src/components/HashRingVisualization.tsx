import React from 'react';
import { Server } from '../types';

interface HashRingVisualizationProps {
  servers: Server[];
}

export const HashRingVisualization: React.FC<HashRingVisualizationProps> = ({ servers }) => {
  const centerX = 200;
  const centerY = 200;
  const radius = 150;

  const serverColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
  ];

  // Generate virtual node positions
  const nodes = servers.flatMap((server, serverIndex) => {
    const nodesPerServer = Math.min(server.virtualNodes, 20); // Limit for visualization
    return Array.from({ length: nodesPerServer }, (_, i) => {
      const angle = (serverIndex * nodesPerServer + i) * (2 * Math.PI / (servers.length * 20));
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: serverColors[serverIndex % serverColors.length],
        serverId: server.id
      };
    });
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-md font-semibold mb-4">Hash Ring Visualization</h3>
      <svg width="400" height="400" viewBox="0 0 400 400">
        {/* Ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Virtual nodes */}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r="4"
            fill={node.color}
          />
        ))}

        {/* Legend */}
        {servers.map((server, i) => (
          <g key={server.id} transform={`translate(20, ${320 + i * 20})`}>
            <circle r="6" fill={serverColors[i % serverColors.length]} />
            <text x="15" y="4" fontSize="12">{server.name} ({server.virtualNodes} nodes)</text>
          </g>
        ))}
      </svg>
    </div>
  );
};
