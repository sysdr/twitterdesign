import { SecurityEvent, ThreatScore } from '../models/SecurityEvent';
import { RateLimitDetector } from './RateLimitDetector';
import { AnomalyDetector } from './AnomalyDetector';
import { SignatureMatcher } from './SignatureMatcher';

export class ThreatAnalyzer {
  private rateLimitDetector: RateLimitDetector;
  private anomalyDetector: AnomalyDetector;
  private signatureMatcher: SignatureMatcher;

  constructor() {
    this.rateLimitDetector = new RateLimitDetector();
    this.anomalyDetector = new AnomalyDetector();
    this.signatureMatcher = new SignatureMatcher();
  }

  async analyzeEvent(event: SecurityEvent): Promise<ThreatScore> {
    const reasoning: string[] = [];
    
    // Run parallel threat detection
    const [rateScore, anomalyScore, signatureScore] = await Promise.all([
      this.rateLimitDetector.analyze(event),
      this.anomalyDetector.analyze(event),
      this.signatureMatcher.analyze(event)
    ]);

    const finalScore = this.calculateFinalScore(rateScore, anomalyScore, signatureScore);

    if (rateScore.score > 0.7) reasoning.push(rateScore.reason);
    if (anomalyScore.score > 0.7) reasoning.push(anomalyScore.reason);
    if (signatureScore.score > 0.7) reasoning.push(signatureScore.reason);

    const confidence = this.calculateConfidence(rateScore, anomalyScore, signatureScore);
    const action = this.determineAction(finalScore);
    const threatType = this.identifyThreatType(rateScore, anomalyScore, signatureScore);

    return {
      score: finalScore,
      confidence,
      threatType,
      recommendedAction: action,
      reasoning
    };
  }

  private calculateFinalScore(
    rateScore: { score: number },
    anomalyScore: { score: number },
    signatureScore: { score: number }
  ): number {
    let weighted = (
      rateScore.score * 0.4 +
      anomalyScore.score * 0.3 +
      signatureScore.score * 0.3
    );

    if (signatureScore.score >= 0.9) {
      weighted = Math.max(weighted, signatureScore.score);
    }

    if (rateScore.score >= 0.95 && anomalyScore.score >= 0.7) {
      weighted = Math.max(weighted, 0.95);
    }

    return Math.min(1, weighted);
  }

  private calculateConfidence(
    rateScore: any,
    anomalyScore: any,
    signatureScore: any
  ): number {
    // High confidence when multiple detectors agree
    const scores = [rateScore.score, anomalyScore.score, signatureScore.score];
    const highScores = scores.filter(s => s > 0.7).length;
    
    if (highScores >= 2) return 0.95;
    if (highScores === 1) return 0.75;
    return 0.50;
  }

  private determineAction(score: number): 'BLOCK' | 'RATE_LIMIT' | 'MONITOR' | 'ALLOW' {
    if (score >= 0.9) return 'BLOCK';
    if (score >= 0.7) return 'RATE_LIMIT';
    if (score >= 0.5) return 'MONITOR';
    return 'ALLOW';
  }

  private identifyThreatType(rateScore: any, anomalyScore: any, signatureScore: any): string {
    if (rateScore.score > 0.8) return 'BRUTE_FORCE';
    if (signatureScore.score > 0.8) return 'INJECTION_ATTACK';
    if (anomalyScore.score > 0.8) return 'ANOMALOUS_BEHAVIOR';
    return 'SUSPICIOUS_ACTIVITY';
  }

  async cleanup(): Promise<void> {
    await Promise.allSettled([
      this.rateLimitDetector.cleanup(),
      this.anomalyDetector.cleanup()
    ]);
  }
}
