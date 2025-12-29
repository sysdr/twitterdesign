#!/bin/bash

# Lesson 60: System Handoff and Documentation - Setup Script
# Creates a complete documentation generation and management system

set -e

echo "========================================="
echo "Lesson 60: Documentation System Setup"
echo "========================================="

# Create project structure
echo "Creating project structure..."
mkdir -p lesson60-documentation-system/{src,public,tests}
cd lesson60-documentation-system

mkdir -p src/{components,parsers,generators,validators,types,cli}
mkdir -p src/components/{Dashboard,RunbookViewer,ArchitectureDiagram,MetricsPanel}
mkdir -p public/{docs,runbooks,diagrams}
mkdir -p tests/{unit,integration}

# Create package.json
echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "lesson60-documentation-system",
  "version": "1.0.0",
  "description": "Automated documentation generation and knowledge transfer system",
  "main": "src/index.tsx",
  "scripts": {
    "start": "webpack serve --mode development --port 3000",
    "build": "webpack --mode production",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "docs:generate": "ts-node src/cli/generate.ts",
    "docs:verify": "ts-node src/cli/verify.ts",
    "test:runbooks": "ts-node src/validators/runbookTester.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "marked": "^12.0.2",
    "js-yaml": "^4.1.0",
    "axios": "^1.7.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.12.12",
    "@types/marked": "^6.0.0",
    "@types/js-yaml": "^4.0.9",
    "typescript": "^5.4.5",
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.0.4",
    "ts-loader": "^9.5.1",
    "html-webpack-plugin": "^5.6.0",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.3"
  }
}
EOF

# Create TypeScript config
echo "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create Webpack config
echo "Creating webpack.config.js..."
cat > webpack.config.js << 'EOF'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    compress: true,
    port: 3000,
    hot: true
  }
};
EOF

# Create Jest config
echo "Creating jest.config.js..."
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ]
};
EOF

# Create HTML template
echo "Creating public/index.html..."
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation System - Lesson 60</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
</body>
</html>
EOF

# Create Type Definitions
echo "Creating type definitions..."
cat > src/types/index.ts << 'EOF'
export interface ComponentDoc {
  name: string;
  purpose: string;
  scalability: string;
  dependencies: string[];
  monitoring: string;
  runbook: string;
  sourceFile: string;
}

export interface Runbook {
  id: string;
  title: string;
  symptom: string;
  impact: string;
  diagnosis: Step[];
  remediation: Step[];
  verification: Step[];
  escalation: Contact[];
  lastTested: Date;
  passRate: number;
}

export interface Step {
  order: number;
  command: string;
  expectedOutput: string;
  timeout: number;
  automated: boolean;
}

export interface Contact {
  role: string;
  name: string;
  slack: string;
  phone: string;
}

export interface HandoffChecklist {
  role: string;
  prerequisites: Skill[];
  tasks: Task[];
  completionRate: number;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  validated: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  successCriteria: string;
  estimatedTime: number;
  completed: boolean;
  validatedBy: string;
}

export interface DocumentationMetrics {
  coverage: number;
  freshness: number;
  accuracy: number;
  usage: number;
  timeToResolution: number;
  totalComponents: number;
  documentedComponents: number;
  staleDocuments: number;
}

export interface ArchitectureNode {
  id: string;
  type: 'service' | 'database' | 'cache' | 'queue';
  name: string;
  dependencies: string[];
  health: 'healthy' | 'degraded' | 'down';
  metrics: {
    uptime: number;
    latency: number;
    errorRate: number;
  };
}
EOF

# Create Documentation Parser
echo "Creating documentation parser..."
cat > src/parsers/codeParser.ts << 'EOF'
import { ComponentDoc } from '../types';

export class CodeParser {
  parseComponentAnnotations(sourceCode: string, fileName: string): ComponentDoc | null {
    const componentMatch = sourceCode.match(/@component\s+(\w+)/);
    if (!componentMatch) return null;

    const purposeMatch = sourceCode.match(/@purpose\s+(.+)/);
    const scalabilityMatch = sourceCode.match(/@scalability\s+(.+)/);
    const dependenciesMatch = sourceCode.match(/@dependencies\s+(.+)/);
    const monitoringMatch = sourceCode.match(/@monitoring\s+(.+)/);
    const runbookMatch = sourceCode.match(/@runbook\s+(.+)/);

    return {
      name: componentMatch[1],
      purpose: purposeMatch ? purposeMatch[1] : 'No purpose documented',
      scalability: scalabilityMatch ? scalabilityMatch[1] : 'Not specified',
      dependencies: dependenciesMatch ? dependenciesMatch[1].split(',').map(d => d.trim()) : [],
      monitoring: monitoringMatch ? monitoringMatch[1] : 'No monitoring configured',
      runbook: runbookMatch ? runbookMatch[1] : 'No runbook available',
      sourceFile: fileName
    };
  }

  parseAllComponents(sources: Map<string, string>): ComponentDoc[] {
    const docs: ComponentDoc[] = [];
    
    sources.forEach((code, fileName) => {
      const doc = this.parseComponentAnnotations(code, fileName);
      if (doc) {
        docs.push(doc);
      }
    });

    return docs;
  }

  generateDependencyGraph(docs: ComponentDoc[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    docs.forEach(doc => {
      graph.set(doc.name, doc.dependencies);
    });

    return graph;
  }
}
EOF

# Create Runbook Generator
echo "Creating runbook generator..."
cat > src/generators/runbookGenerator.ts << 'EOF'
import { Runbook, Step, Contact } from '../types';

export class RunbookGenerator {
  private runbooks: Runbook[] = [];

  generateFromTemplate(symptom: string, component: string): Runbook {
    const id = `RB-${Date.now()}`;
    
    return {
      id,
      title: `${component} - ${symptom}`,
      symptom,
      impact: `Users may experience degraded ${component} performance`,
      diagnosis: this.generateDiagnosisSteps(component),
      remediation: this.generateRemediationSteps(component),
      verification: this.generateVerificationSteps(component),
      escalation: this.getDefaultEscalation(),
      lastTested: new Date(),
      passRate: 100
    };
  }

  private generateDiagnosisSteps(component: string): Step[] {
    return [
      {
        order: 1,
        command: 'curl http://localhost:3000/health/check',
        expectedOutput: '{"status": "healthy"}',
        timeout: 5000,
        automated: true
      },
      {
        order: 2,
        command: `docker logs ${component} --tail 100`,
        expectedOutput: 'No ERROR messages in last 100 lines',
        timeout: 10000,
        automated: true
      },
      {
        order: 3,
        command: `docker stats ${component} --no-stream`,
        expectedOutput: 'CPU < 80%, Memory < 85%',
        timeout: 5000,
        automated: true
      }
    ];
  }

  private generateRemediationSteps(component: string): Step[] {
    return [
      {
        order: 1,
        command: `docker restart ${component}`,
        expectedOutput: `${component} restarted successfully`,
        timeout: 30000,
        automated: false
      },
      {
        order: 2,
        command: 'sleep 10 && curl http://localhost:3000/health/check',
        expectedOutput: '{"status": "healthy"}',
        timeout: 15000,
        automated: true
      }
    ];
  }

  private generateVerificationSteps(component: string): Step[] {
    return [
      {
        order: 1,
        command: 'curl http://localhost:3000/metrics',
        expectedOutput: 'error_rate < 0.01',
        timeout: 5000,
        automated: true
      },
      {
        order: 2,
        command: `docker ps | grep ${component}`,
        expectedOutput: 'Up [running time]',
        timeout: 5000,
        automated: true
      }
    ];
  }

  private getDefaultEscalation(): Contact[] {
    return [
      {
        role: 'Primary On-Call',
        name: 'SRE Team',
        slack: '#incidents',
        phone: '+1-555-0100'
      },
      {
        role: 'Secondary',
        name: 'Backend Team',
        slack: '#backend-support',
        phone: '+1-555-0101'
      }
    ];
  }

  getAllRunbooks(): Runbook[] {
    return this.runbooks;
  }

  addRunbook(runbook: Runbook): void {
    this.runbooks.push(runbook);
  }
}
EOF

# Create Runbook Validator
echo "Creating runbook validator..."
cat > src/validators/runbookTester.ts << 'EOF'
import { Runbook, Step } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RunbookTester {
  async testRunbook(runbook: Runbook): Promise<{success: boolean; failedSteps: number[]}> {
    console.log(`\nTesting runbook: ${runbook.title}`);
    const failedSteps: number[] = [];
    
    const allSteps = [
      ...runbook.diagnosis,
      ...runbook.remediation,
      ...runbook.verification
    ];

    for (const step of allSteps) {
      if (!step.automated) {
        console.log(`  ⊘ Step ${step.order}: ${step.command} (manual - skipped)`);
        continue;
      }

      try {
        const result = await this.executeStep(step);
        if (result.success) {
          console.log(`  ✓ Step ${step.order}: ${step.command}`);
        } else {
          console.log(`  ✗ Step ${step.order}: ${step.command} - FAILED`);
          failedSteps.push(step.order);
        }
      } catch (error) {
        console.log(`  ✗ Step ${step.order}: ${step.command} - ERROR`);
        failedSteps.push(step.order);
      }
    }

    const success = failedSteps.length === 0;
    console.log(success ? '  Overall: PASSED ✓' : '  Overall: FAILED ✗');
    
    return { success, failedSteps };
  }

  private async executeStep(step: Step): Promise<{success: boolean; output: string}> {
    try {
      // Mock execution for demonstration
      // In production, this would actually run commands in a safe environment
      const mockSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      return {
        success: mockSuccess,
        output: mockSuccess ? step.expectedOutput : 'Command failed'
      };
    } catch (error) {
      return {
        success: false,
        output: `Error: ${error}`
      };
    }
  }

  async testAllRunbooks(runbooks: Runbook[]): Promise<void> {
    console.log('\n=== Running Runbook Test Suite ===\n');
    
    let passedCount = 0;
    let failedCount = 0;

    for (const runbook of runbooks) {
      const result = await this.testRunbook(runbook);
      if (result.success) {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    console.log('\n=== Test Summary ===');
    console.log(`Total Runbooks: ${runbooks.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Pass Rate: ${((passedCount / runbooks.length) * 100).toFixed(1)}%\n`);
  }
}
EOF

# Create Metrics Calculator
echo "Creating metrics calculator..."
cat > src/generators/metricsCalculator.ts << 'EOF'
import { DocumentationMetrics, ComponentDoc, Runbook } from '../types';

export class MetricsCalculator {
  calculateMetrics(
    components: ComponentDoc[],
    runbooks: Runbook[],
    totalComponents: number
  ): DocumentationMetrics {
    const documentedComponents = components.length;
    const coverage = totalComponents > 0 ? (documentedComponents / totalComponents) * 100 : 0;

    // Calculate freshness (days since last update)
    const now = new Date();
    const lastUpdate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Mock: 7 days ago
    const freshness = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate accuracy from runbook pass rates
    const totalPassRate = runbooks.reduce((sum, rb) => sum + rb.passRate, 0);
    const accuracy = runbooks.length > 0 ? totalPassRate / runbooks.length : 100;

    // Mock usage and time metrics
    const usage = Math.floor(Math.random() * 1000) + 500; // Page views
    const timeToResolution = 15 + Math.random() * 30; // Minutes

    const staleDocuments = components.filter(c => {
      // Mock: Consider docs stale if no recent activity
      return Math.random() > 0.8;
    }).length;

    return {
      coverage,
      freshness,
      accuracy,
      usage,
      timeToResolution,
      totalComponents,
      documentedComponents,
      staleDocuments
    };
  }

  generateHealthScore(metrics: DocumentationMetrics): number {
    const coverageScore = metrics.coverage;
    const freshnessScore = Math.max(0, 100 - metrics.freshness * 2);
    const accuracyScore = metrics.accuracy;
    
    return (coverageScore * 0.4 + freshnessScore * 0.3 + accuracyScore * 0.3);
  }
}
EOF

# Create Architecture Diagram Generator
echo "Creating architecture diagram generator..."
cat > src/generators/architectureDiagramGenerator.ts << 'EOF'
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
EOF

# Create React Components - Dashboard
echo "Creating Dashboard component..."
cat > src/components/Dashboard/Dashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { MetricsPanel } from '../MetricsPanel/MetricsPanel';
import { RunbookViewer } from '../RunbookViewer/RunbookViewer';
import { ArchitectureDiagram } from '../ArchitectureDiagram/ArchitectureDiagram';
import { DocumentationMetrics, Runbook, ArchitectureNode } from '../../types';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DocumentationMetrics | null>(null);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'runbooks' | 'architecture'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Mock data - in production, this would fetch from API
    setMetrics({
      coverage: 92.5,
      freshness: 7,
      accuracy: 95.2,
      usage: 847,
      timeToResolution: 28.5,
      totalComponents: 60,
      documentedComponents: 55,
      staleDocuments: 3
    });

    setRunbooks([
      {
        id: 'RB-001',
        title: 'Database Connection Pool Exhaustion',
        symptom: 'High connection wait times',
        impact: 'API latency increases',
        diagnosis: [],
        remediation: [],
        verification: [],
        escalation: [],
        lastTested: new Date(),
        passRate: 100
      },
      {
        id: 'RB-002',
        title: 'Cache Miss Storm',
        symptom: 'Sudden increase in cache misses',
        impact: 'Database load spikes',
        diagnosis: [],
        remediation: [],
        verification: [],
        escalation: [],
        lastTested: new Date(),
        passRate: 95
      },
      {
        id: 'RB-003',
        title: 'Message Queue Backlog',
        symptom: 'Queue depth increasing',
        impact: 'Delayed tweet delivery',
        diagnosis: [],
        remediation: [],
        verification: [],
        escalation: [],
        lastTested: new Date(),
        passRate: 98
      }
    ]);

    setNodes([
      {
        id: 'api',
        type: 'service',
        name: 'API',
        dependencies: ['database', 'cache'],
        health: 'healthy',
        metrics: { uptime: 99.9, latency: 45, errorRate: 0.002 }
      },
      {
        id: 'database',
        type: 'database',
        name: 'PostgreSQL',
        dependencies: [],
        health: 'healthy',
        metrics: { uptime: 99.95, latency: 12, errorRate: 0.001 }
      },
      {
        id: 'cache',
        type: 'cache',
        name: 'Redis',
        dependencies: [],
        health: 'healthy',
        metrics: { uptime: 99.8, latency: 2, errorRate: 0.005 }
      },
      {
        id: 'queue',
        type: 'queue',
        name: 'Kafka',
        dependencies: [],
        health: 'degraded',
        metrics: { uptime: 98.5, latency: 150, errorRate: 0.015 }
      }
    ]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>📚 Documentation System</h1>
        <p style={styles.subtitle}>Production-Ready Knowledge Management</p>
      </header>

      <nav style={styles.nav}>
        {['overview', 'runbooks', 'architecture'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              ...styles.navButton,
              ...(activeTab === tab ? styles.navButtonActive : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'overview' && metrics && (
          <MetricsPanel metrics={metrics} />
        )}
        {activeTab === 'runbooks' && (
          <RunbookViewer runbooks={runbooks} />
        )}
        {activeTab === 'architecture' && (
          <ArchitectureDiagram nodes={nodes} />
        )}
      </main>

      <footer style={styles.footer}>
        <p>Lesson 60: System Handoff & Documentation | Twitter Clone Course</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '30px'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
  },
  subtitle: {
    fontSize: '20px',
    opacity: 0.9
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  navButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: '2px solid white',
    borderRadius: '25px',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  navButtonActive: {
    background: 'white',
    color: '#667eea'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    minHeight: '500px'
  },
  footer: {
    textAlign: 'center',
    color: 'white',
    marginTop: '30px',
    opacity: 0.8,
    fontSize: '14px'
  }
};
EOF

# Create MetricsPanel component
echo "Creating MetricsPanel component..."
cat > src/components/MetricsPanel/MetricsPanel.tsx << 'EOF'
import React from 'react';
import { DocumentationMetrics } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  metrics: DocumentationMetrics;
}

export const MetricsPanel: React.FC<Props> = ({ metrics }) => {
  const healthScore = (
    metrics.coverage * 0.4 +
    Math.max(0, 100 - metrics.freshness * 2) * 0.3 +
    metrics.accuracy * 0.3
  );

  const chartData = [
    { name: 'Coverage', value: metrics.coverage },
    { name: 'Accuracy', value: metrics.accuracy },
    { name: 'Freshness', value: Math.max(0, 100 - metrics.freshness * 2) }
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Documentation Health Metrics</h2>

      <div style={styles.scoreCard}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreValue}>{healthScore.toFixed(1)}</span>
          <span style={styles.scoreLabel}>Health Score</span>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard
          title="Coverage"
          value={`${metrics.coverage.toFixed(1)}%`}
          subtitle={`${metrics.documentedComponents}/${metrics.totalComponents} components`}
          color="#48bb78"
        />
        <MetricCard
          title="Accuracy"
          value={`${metrics.accuracy.toFixed(1)}%`}
          subtitle="Runbook success rate"
          color="#4299e1"
        />
        <MetricCard
          title="Freshness"
          value={`${metrics.freshness} days`}
          subtitle="Since last update"
          color="#ed8936"
        />
        <MetricCard
          title="Usage"
          value={metrics.usage.toString()}
          subtitle="Page views (30 days)"
          color="#9f7aea"
        />
      </div>

      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Documentation Quality Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.insights}>
        <h3 style={styles.insightTitle}>Key Insights</h3>
        <ul style={styles.insightList}>
          <li>✅ {metrics.documentedComponents} components fully documented</li>
          <li>{metrics.staleDocuments > 0 ? '⚠️' : '✅'} {metrics.staleDocuments} stale documents need updating</li>
          <li>📊 Average incident resolution: {metrics.timeToResolution.toFixed(1)} minutes</li>
          <li>🎯 Target: 95% coverage, 100% accuracy, <7 day freshness</li>
        </ul>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ title, value, subtitle, color }) => (
  <div style={{ ...styles.metricCard, borderLeft: `4px solid ${color}` }}>
    <h3 style={styles.metricTitle}>{title}</h3>
    <p style={{ ...styles.metricValue, color }}>{value}</p>
    <p style={styles.metricSubtitle}>{subtitle}</p>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '30px',
    textAlign: 'center'
  },
  scoreCard: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px'
  },
  scoreCircle: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white'
  },
  scoreLabel: {
    fontSize: '16px',
    color: 'white',
    opacity: 0.9,
    marginTop: '10px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  metricCard: {
    background: '#f7fafc',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  metricTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: '10px'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  metricSubtitle: {
    fontSize: '14px',
    color: '#a0aec0'
  },
  chartContainer: {
    marginBottom: '40px'
  },
  chartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px'
  },
  insights: {
    background: '#f7fafc',
    padding: '25px',
    borderRadius: '12px',
    borderLeft: '4px solid #667eea'
  },
  insightTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px'
  },
  insightList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  }
};
EOF

# Create RunbookViewer component
echo "Creating RunbookViewer component..."
cat > src/components/RunbookViewer/RunbookViewer.tsx << 'EOF'
import React, { useState } from 'react';
import { Runbook } from '../../types';

interface Props {
  runbooks: Runbook[];
}

export const RunbookViewer: React.FC<Props> = ({ runbooks }) => {
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(runbooks[0] || null);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Operational Runbooks</h2>
      
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Available Runbooks</h3>
          {runbooks.map(rb => (
            <div
              key={rb.id}
              onClick={() => setSelectedRunbook(rb)}
              style={{
                ...styles.runbookItem,
                ...(selectedRunbook?.id === rb.id ? styles.runbookItemActive : {})
              }}
            >
              <div style={styles.runbookHeader}>
                <span style={styles.runbookId}>{rb.id}</span>
                <span style={{
                  ...styles.runbookStatus,
                  color: rb.passRate >= 95 ? '#48bb78' : '#ed8936'
                }}>
                  {rb.passRate}%
                </span>
              </div>
              <p style={styles.runbookTitle}>{rb.title}</p>
            </div>
          ))}
        </div>

        <div style={styles.content}>
          {selectedRunbook ? (
            <>
              <div style={styles.runbookHeader}>
                <h3 style={styles.runbookDetailTitle}>{selectedRunbook.title}</h3>
                <span style={styles.runbookMeta}>
                  Last tested: {selectedRunbook.lastTested.toLocaleDateString()}
                </span>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>🔍 Symptom</h4>
                <p style={styles.sectionContent}>{selectedRunbook.symptom}</p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>⚠️ Impact</h4>
                <p style={styles.sectionContent}>{selectedRunbook.impact}</p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>🔧 Quick Actions</h4>
                <div style={styles.commandBox}>
                  <code style={styles.command}>docker-compose restart api</code>
                  <code style={styles.command}>curl http://localhost:3000/health</code>
                  <code style={styles.command}>docker logs api --tail 50</code>
                </div>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>📞 Escalation</h4>
                {selectedRunbook.escalation.map((contact, i) => (
                  <div key={i} style={styles.contact}>
                    <strong>{contact.role}:</strong> {contact.name}
                    <span style={styles.contactInfo}>
                      {contact.slack} • {contact.phone}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p>Select a runbook to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '30px'
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '30px'
  },
  sidebar: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '12px',
    height: 'fit-content'
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px'
  },
  runbookItem: {
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  runbookItemActive: {
    background: 'white',
    border: '2px solid #667eea',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
  },
  runbookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  runbookId: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096'
  },
  runbookStatus: {
    fontSize: '12px',
    fontWeight: 'bold'
  },
  runbookTitle: {
    fontSize: '14px',
    color: '#2d3748',
    margin: 0
  },
  content: {
    background: '#f7fafc',
    padding: '30px',
    borderRadius: '12px'
  },
  runbookDetailTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '10px'
  },
  runbookMeta: {
    fontSize: '14px',
    color: '#718096'
  },
  section: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px'
  },
  sectionContent: {
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.6'
  },
  commandBox: {
    background: '#2d3748',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  command: {
    color: '#48bb78',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  contact: {
    marginBottom: '10px',
    fontSize: '14px',
    color: '#2d3748'
  },
  contactInfo: {
    marginLeft: '10px',
    color: '#718096'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#a0aec0',
    fontSize: '18px'
  }
};
EOF

# Create ArchitectureDiagram component
echo "Creating ArchitectureDiagram component..."
cat > src/components/ArchitectureDiagram/ArchitectureDiagram.tsx << 'EOF'
import React from 'react';
import { ArchitectureNode } from '../../types';

interface Props {
  nodes: ArchitectureNode[];
}

export const ArchitectureDiagram: React.FC<Props> = ({ nodes }) => {
  const getNodeColor = (node: ArchitectureNode): string => {
    if (node.health === 'down') return '#fc8181';
    if (node.health === 'degraded') return '#f6ad55';
    
    switch (node.type) {
      case 'database': return '#90cdf4';
      case 'cache': return '#9ae6b4';
      case 'queue': return '#fbb6ce';
      default: return '#e9d8fd';
    }
  };

  const getHealthEmoji = (health: string): string => {
    switch (health) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'down': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>System Architecture</h2>
      
      <div style={styles.diagramContainer}>
        <svg viewBox="0 0 800 600" style={styles.svg}>
          <defs>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <rect width="800" height="600" fill="white"/>
          
          {/* Draw connections */}
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const x1 = 400 + 200 * Math.cos(angle);
            const y1 = 300 + 200 * Math.sin(angle);
            
            return node.dependencies.map(depName => {
              const depIndex = nodes.findIndex(n => n.name === depName);
              if (depIndex >= 0) {
                const depAngle = (depIndex / nodes.length) * 2 * Math.PI;
                const x2 = 400 + 200 * Math.cos(depAngle);
                const y2 = 300 + 200 * Math.sin(depAngle);
                
                return (
                  <line
                    key={`${node.id}-${depName}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e0"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                );
              }
              return null;
            });
          })}
          
          {/* Draw nodes */}
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const x = 400 + 200 * Math.cos(angle);
            const y = 300 + 200 * Math.sin(angle);
            const color = getNodeColor(node);
            
            return (
              <g key={node.id} transform={`translate(${x},${y})`} filter="url(#shadow)">
                <circle r="40" fill={color} stroke="#2d3748" strokeWidth="2"/>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#2d3748"
                >
                  {node.name}
                </text>
                <text
                  textAnchor="middle"
                  y="20"
                  fontSize="9"
                  fill="#4a5568"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={styles.nodeDetails}>
        <h3 style={styles.detailsTitle}>Component Details</h3>
        <div style={styles.nodeGrid}>
          {nodes.map(node => (
            <div key={node.id} style={{
              ...styles.nodeCard,
              borderLeft: `4px solid ${getNodeColor(node)}`
            }}>
              <div style={styles.nodeCardHeader}>
                <span style={styles.nodeName}>{node.name}</span>
                <span>{getHealthEmoji(node.health)}</span>
              </div>
              <div style={styles.nodeMetrics}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Uptime:</span>
                  <span style={styles.metricValue}>{node.metrics.uptime.toFixed(2)}%</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Latency:</span>
                  <span style={styles.metricValue}>{node.metrics.latency.toFixed(0)}ms</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Error Rate:</span>
                  <span style={styles.metricValue}>{(node.metrics.errorRate * 100).toFixed(3)}%</span>
                </div>
              </div>
              {node.dependencies.length > 0 && (
                <div style={styles.dependencies}>
                  <span style={styles.depLabel}>Dependencies:</span>
                  <span style={styles.depValue}>{node.dependencies.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '30px'
  },
  diagramContainer: {
    background: '#f7fafc',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px'
  },
  svg: {
    width: '100%',
    height: 'auto'
  },
  nodeDetails: {
    marginTop: '30px'
  },
  detailsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px'
  },
  nodeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  nodeCard: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '12px'
  },
  nodeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  nodeName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748'
  },
  nodeMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px'
  },
  metricLabel: {
    color: '#718096'
  },
  metricValue: {
    fontWeight: '600',
    color: '#2d3748'
  },
  dependencies: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '14px'
  },
  depLabel: {
    color: '#718096',
    marginRight: '8px'
  },
  depValue: {
    color: '#2d3748',
    fontWeight: '500'
  }
};
EOF

# Create main index file
echo "Creating main index.tsx..."
cat > src/index.tsx << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard/Dashboard';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
EOF

# Create CLI tools for documentation generation
echo "Creating CLI generation tool..."
cat > src/cli/generate.ts << 'EOF'
import { CodeParser } from '../parsers/codeParser';
import { RunbookGenerator } from '../generators/runbookGenerator';
import { MetricsCalculator } from '../generators/metricsCalculator';
import { ArchitectureDiagramGenerator } from '../generators/architectureDiagramGenerator';

async function generateDocumentation() {
  console.log('\n=== Documentation Generation ===\n');

  // Sample annotated components
  const sampleSources = new Map<string, string>([
    ['TweetFeed.tsx', `
      /**
       * @component TweetFeed
       * @purpose Displays real-time tweet timeline
       * @scalability Handles 1000 concurrent users via caching
       * @dependencies Redis, PostgreSQL
       * @monitoring /metrics/feed-latency
       * @runbook docs/runbooks/tweet-feed-issues.md
       */
    `],
    ['Database.tsx', `
      /**
       * @component Database
       * @purpose PostgreSQL connection pool management
       * @scalability Connection pooling with max 100 connections
       * @dependencies PostgreSQL
       * @monitoring /metrics/db-connections
       * @runbook docs/runbooks/database-issues.md
       */
    `],
    ['Cache.tsx', `
      /**
       * @component Cache
       * @purpose Redis caching layer
       * @scalability 10GB memory, 100k ops/sec
       * @dependencies Redis
       * @monitoring /metrics/cache-hit-rate
       * @runbook docs/runbooks/cache-issues.md
       */
    `]
  ]);

  // Parse components
  console.log('📝 Parsing component annotations...');
  const parser = new CodeParser();
  const components = parser.parseAllComponents(sampleSources);
  console.log(`   Found ${components.length} documented components\n`);

  // Generate runbooks
  console.log('📚 Generating runbooks...');
  const runbookGen = new RunbookGenerator();
  components.forEach(comp => {
    const runbook = runbookGen.generateFromTemplate(
      `${comp.name} performance degradation`,
      comp.name
    );
    runbookGen.addRunbook(runbook);
  });
  console.log(`   Generated ${runbookGen.getAllRunbooks().length} runbooks\n`);

  // Calculate metrics
  console.log('📊 Calculating documentation metrics...');
  const metricsCalc = new MetricsCalculator();
  const metrics = metricsCalc.calculateMetrics(components, runbookGen.getAllRunbooks(), 60);
  console.log(`   Coverage: ${metrics.coverage.toFixed(1)}%`);
  console.log(`   Accuracy: ${metrics.accuracy.toFixed(1)}%`);
  console.log(`   Health Score: ${metricsCalc.generateHealthScore(metrics).toFixed(1)}/100\n`);

  // Generate architecture diagram
  console.log('🎨 Generating architecture diagram...');
  const diagramGen = new ArchitectureDiagramGenerator();
  const nodes = diagramGen.generateNodes(components);
  console.log(`   Created diagram with ${nodes.length} nodes\n`);

  console.log('✅ Documentation generation complete!\n');
}

generateDocumentation().catch(console.error);
EOF

# Create verification CLI tool
echo "Creating CLI verification tool..."
cat > src/cli/verify.ts << 'EOF'
import { RunbookTester } from '../validators/runbookTester';
import { RunbookGenerator } from '../generators/runbookGenerator';

async function verifyDocumentation() {
  console.log('\n=== Documentation Verification ===\n');

  const runbookGen = new RunbookGenerator();
  
  // Generate sample runbooks
  const runbook1 = runbookGen.generateFromTemplate('High latency', 'API');
  const runbook2 = runbookGen.generateFromTemplate('Connection timeout', 'Database');
  const runbook3 = runbookGen.generateFromTemplate('Cache miss storm', 'Cache');
  
  runbookGen.addRunbook(runbook1);
  runbookGen.addRunbook(runbook2);
  runbookGen.addRunbook(runbook3);

  const tester = new RunbookTester();
  await tester.testAllRunbooks(runbookGen.getAllRunbooks());
}

verifyDocumentation().catch(console.error);
EOF

# Create tests
echo "Creating unit tests..."
cat > tests/unit/parser.test.ts << 'EOF'
import { CodeParser } from '../../src/parsers/codeParser';

describe('CodeParser', () => {
  const parser = new CodeParser();

  test('should parse component annotations', () => {
    const source = `
      /**
       * @component TestComponent
       * @purpose Testing parser
       * @dependencies Redis, PostgreSQL
       */
    `;

    const doc = parser.parseComponentAnnotations(source, 'test.tsx');
    
    expect(doc).not.toBeNull();
    expect(doc?.name).toBe('TestComponent');
    expect(doc?.purpose).toBe('Testing parser');
    expect(doc?.dependencies).toContain('Redis');
  });

  test('should return null for non-annotated code', () => {
    const source = 'const x = 5;';
    const doc = parser.parseComponentAnnotations(source, 'test.tsx');
    
    expect(doc).toBeNull();
  });
});
EOF

cat > tests/unit/runbook.test.ts << 'EOF'
import { RunbookGenerator } from '../../src/generators/runbookGenerator';

describe('RunbookGenerator', () => {
  const generator = new RunbookGenerator();

  test('should generate runbook from template', () => {
    const runbook = generator.generateFromTemplate('High latency', 'API');
    
    expect(runbook.symptom).toBe('High latency');
    expect(runbook.title).toContain('API');
    expect(runbook.diagnosis.length).toBeGreaterThan(0);
    expect(runbook.remediation.length).toBeGreaterThan(0);
  });

  test('should include automated steps', () => {
    const runbook = generator.generateFromTemplate('Test', 'Component');
    const automatedSteps = runbook.diagnosis.filter(s => s.automated);
    
    expect(automatedSteps.length).toBeGreaterThan(0);
  });
});
EOF

# Create Docker files
echo "Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  docs:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    environment:
      - NODE_ENV=development
    command: npm start
EOF

# Create build script
echo "Creating build.sh..."
cat > build.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "Building Documentation System"
echo "========================================="

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Build production bundle
echo "Building production bundle..."
npm run build

# Generate documentation
echo "Generating documentation..."
npm run docs:generate

# Verify runbooks
echo "Verifying runbooks..."
npm run docs:verify

echo ""
echo "✅ Build complete!"
echo "Run 'npm start' to launch the dashboard"
EOF

chmod +x build.sh

# Create start script
echo "Creating start.sh..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "Starting Documentation System"
echo "========================================="

echo "Starting webpack dev server..."
npm start &

echo ""
echo "Dashboard will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"

wait
EOF

chmod +x start.sh

# Create stop script
echo "Creating stop.sh..."
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping all services..."
pkill -f "webpack"
echo "Services stopped"
EOF

chmod +x stop.sh

# Create README
echo "Creating README.md..."
cat > README.md << 'EOF'
# Lesson 60: System Handoff and Documentation

## Overview

A production-ready documentation system that automatically generates, validates, and maintains operational documentation for distributed systems.

## Features

- **Automated Documentation Generation**: Extract docs from code annotations
- **Interactive Runbooks**: Executable operational procedures
- **Architecture Visualization**: Real-time system topology diagrams
- **Metrics Tracking**: Documentation health and effectiveness metrics
- **Knowledge Transfer**: Structured handoff procedures

## Quick Start

### Without Docker

```bash
# Install and build
./build.sh

# Start dashboard
./start.sh

# In another terminal, run tests
npm run test:runbooks
```

### With Docker

```bash
# Build and start
docker-compose up --build

# Access dashboard
open http://localhost:3000
```

## Usage

### Generate Documentation

```bash
npm run docs:generate
```

### Verify Runbooks

```bash
npm run docs:verify
```

### Run Tests

```bash
npm test
npm run test:coverage
```

## Architecture

- **Parsers**: Extract documentation from code annotations
- **Generators**: Create runbooks, diagrams, and metrics
- **Validators**: Test runbook procedures automatically
- **Dashboard**: React-based UI for browsing documentation

## Key Concepts

1. **Documentation as Code**: Version controlled and tested
2. **Executable Runbooks**: Automated verification of procedures
3. **Continuous Validation**: CI/CD integration for freshness
4. **Metrics-Driven**: Track usage and effectiveness

## Metrics

- **Coverage**: % of components with documentation
- **Accuracy**: Runbook success rate from automated tests
- **Freshness**: Days since last update
- **Usage**: Page views and incident references

## License

Educational use - Part of Twitter System Design Course
EOF

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Project structure created successfully"
echo ""
echo "Next steps:"
echo "1. cd lesson60-documentation-system"
echo "2. ./build.sh         # Install deps, run tests, build"
echo "3. ./start.sh         # Start the dashboard"
echo "4. Open http://localhost:3000"
echo ""
echo "Or with Docker:"
echo "1. cd lesson60-documentation-system"
echo "2. docker-compose up --build"
echo "3. Open http://localhost:3000"
echo ""