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
