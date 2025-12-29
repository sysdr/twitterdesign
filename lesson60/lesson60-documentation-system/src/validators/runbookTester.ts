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
