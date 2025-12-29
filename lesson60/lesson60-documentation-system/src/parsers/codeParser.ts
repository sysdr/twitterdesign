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
