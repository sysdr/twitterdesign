import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../types';

interface GraphVisualizationProps {
  data: GraphData;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 800;
    const height = 600;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.edges)
        .id((d: any) => d.id)
        .distance(30))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(5));

    // Add edges
    const link = svg.append('g')
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d: any) => Math.min(Math.sqrt(d.degree) + 2, 15))
      .attr('fill', (d: any) => {
        const hue = (d.id * 137.5) % 360;
        return `hsl(${hue}, 70%, 60%)`;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add node labels for high-degree nodes
    const label = svg.append('g')
      .selectAll('text')
      .data(data.nodes.filter((d: any) => d.degree > 20))
      .join('text')
      .text((d: any) => d.id)
      .attr('font-size', 10)
      .attr('dx', 8)
      .attr('dy', 3);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="graph-visualization">
      <h2>Graph Structure</h2>
      <svg ref={svgRef}></svg>
      <p className="viz-info">
        Showing {data.nodes.length} nodes and {data.edges.length} edges (limited for performance)
      </p>
    </div>
  );
};
