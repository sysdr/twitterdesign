import { ArchitectureNode, ComponentDoc } from '../types';

export class ArchitectureDiagramGenerator {
  generateNodes(components: ComponentDoc[]): ArchitectureNode[] {
    return components.map(comp => ({
      id: comp.name.toLowerCase(),
      type: this.inferType(comp.name),
      name: comp.name,
      dependencies: comp.dependencies,
      health: this.mockHealth(),
      metrics: {
        uptime: 99.5 + Math.random() * 0.5,
        latency: 50 + Math.random() * 150,
        errorRate: Math.random() * 0.01
      }
    }));
  }

  private inferType(name: string): 'service' | 'database' | 'cache' | 'queue' {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('db') || nameLower.includes('database')) return 'database';
    if (nameLower.includes('cache') || nameLower.includes('redis')) return 'cache';
    if (nameLower.includes('queue') || nameLower.includes('kafka')) return 'queue';
    return 'service';
  }

  private mockHealth(): 'healthy' | 'degraded' | 'down' {
    const rand = Math.random();
    if (rand > 0.95) return 'down';
    if (rand > 0.85) return 'degraded';
    return 'healthy';
  }

  generateSVG(nodes: ArchitectureNode[]): string {
    const width = 800;
    const height = 600;
    const nodeRadius = 40;
    
    // Simple circular layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 200;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    svg += `  <rect width="${width}" height="${height}" fill="white"/>\n`;
    svg += `  <defs>\n`;
    svg += `    <filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter>\n`;
    svg += `  </defs>\n`;

    // Draw connections
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);

      node.dependencies.forEach(depName => {
        const depIndex = nodes.findIndex(n => n.name === depName);
        if (depIndex >= 0) {
          const depAngle = (depIndex / nodes.length) * 2 * Math.PI;
          const x2 = centerX + radius * Math.cos(depAngle);
          const y2 = centerY + radius * Math.sin(depAngle);
          
          svg += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#cbd5e0" stroke-width="2" opacity="0.6"/>\n`;
        }
      });
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const color = this.getNodeColor(node.type, node.health);
      
      svg += `  <g transform="translate(${x},${y})" filter="url(#shadow)">\n`;
      svg += `    <circle r="${nodeRadius}" fill="${color}" stroke="#2d3748" stroke-width="2"/>\n`;
      svg += `    <text text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="bold" fill="#2d3748">${node.name}</text>\n`;
      svg += `    <text text-anchor="middle" y="20" font-size="9" fill="#4a5568">${node.type}</text>\n`;
      svg += `  </g>\n`;
    });

    svg += `</svg>`;
    return svg;
  }

  private getNodeColor(type: string, health: string): string {
    if (health === 'down') return '#fc8181';
    if (health === 'degraded') return '#f6ad55';
    
    switch (type) {
      case 'database': return '#90cdf4';
      case 'cache': return '#9ae6b4';
      case 'queue': return '#fbb6ce';
      default: return '#e9d8fd';
    }
  }
}
