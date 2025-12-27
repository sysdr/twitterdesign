import { AssessmentResult, CategoryScore } from './types';

export class ScoringSystem {
  generateReport(assessment: AssessmentResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('PRODUCTION READINESS ASSESSMENT REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Assessment ID: ${assessment.id}`);
    lines.push(`Date: ${assessment.startTime.toISOString()}`);
    lines.push(`Duration: ${(assessment.duration / 1000).toFixed(2)}s`);
    lines.push('');
    
    // Overall status
    lines.push(`Overall Status: ${this.formatStatus(assessment.status)}`);
    lines.push(`Overall Score: ${assessment.overallScore.toFixed(1)}/100`);
    lines.push('');
    
    // Category breakdown
    lines.push('CATEGORY SCORES:');
    lines.push('-'.repeat(60));
    
    assessment.categoryScores.forEach(cs => {
      const bar = this.createProgressBar(cs.score);
      lines.push(`${cs.category.padEnd(20)} ${bar} ${cs.score.toFixed(1)}% (${cs.status.toUpperCase()})`);
      lines.push(`  Weight: ${(cs.weight * 100).toFixed(0)}% | Passed: ${cs.checksPassed}/${cs.checksCompleted}`);
    });
    
    lines.push('');
    
    // Failed checks
    const failedChecks = assessment.checks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      lines.push('FAILED CHECKS:');
      lines.push('-'.repeat(60));
      
      failedChecks.forEach(check => {
        lines.push(`[${check.checkId}] Score: ${check.score.toFixed(0)}/100`);
        if (check.findings.length > 0) {
          check.findings.forEach(f => lines.push(`  - ${f}`));
        }
        if (check.recommendations.length > 0) {
          lines.push('  Recommendations:');
          check.recommendations.forEach(r => lines.push(`    * ${r}`));
        }
        lines.push('');
      });
    }
    
    // Recommendations
    lines.push('');
    lines.push('NEXT STEPS:');
    lines.push('-'.repeat(60));
    
    if (assessment.status === 'ready') {
      lines.push('✓ System is PRODUCTION READY');
      lines.push('  - All critical checks passed');
      lines.push('  - Monitor system closely after deployment');
      lines.push('  - Continue regular assessments');
    } else if (assessment.status === 'needs-attention') {
      lines.push('⚠ System NEEDS ATTENTION before production');
      lines.push('  - Address all failed checks');
      lines.push('  - Re-run assessment after fixes');
      lines.push('  - Consider additional testing');
    } else {
      lines.push('✗ System is NOT READY for production');
      lines.push('  - Critical issues must be resolved');
      lines.push('  - Do NOT deploy to production');
      lines.push('  - Address all recommendations');
    }
    
    lines.push('');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ready': '✓ READY',
      'needs-attention': '⚠ NEEDS ATTENTION',
      'not-ready': '✗ NOT READY'
    };
    return statusMap[status] || status.toUpperCase();
  }

  private createProgressBar(score: number, width: number = 20): string {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }
}
