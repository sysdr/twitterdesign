/**
 * Predictive Cache Warming
 * Learns access patterns and preloads data
 * Similar to Netflix's predictive preloading
 */

interface AccessPattern {
  from: string;
  to: string;
  count: number;
  probability: number;
}

export interface PredictiveConfig {
  minConfidence: number;  // Minimum probability to trigger warming
  maxPredictions: number;  // Max items to predict per access
  learningWindow: number;  // How far back to learn patterns (ms)
}

export class PredictiveWarmer {
  private patterns: Map<string, Map<string, number>>;  // from -> to -> count
  private config: PredictiveConfig;
  private predictions: number;
  private correctPredictions: number;
  private accessSequence: Array<{ key: string; timestamp: number }>;

  constructor(config: PredictiveConfig) {
    this.patterns = new Map();
    this.config = config;
    this.predictions = 0;
    this.correctPredictions = 0;
    this.accessSequence = [];
  }

  /**
   * Learn from an access
   * Updates pattern matrix when items are accessed in sequence
   */
  learn(key: string): void {
    const now = Date.now();
    this.accessSequence.push({ key, timestamp: now });

    // Keep only recent accesses
    const cutoff = now - this.config.learningWindow;
    this.accessSequence = this.accessSequence.filter(a => a.timestamp > cutoff);

    // Find previous access (within 10 seconds)
    const recentAccesses = this.accessSequence.filter(
      a => now - a.timestamp < 10000 && a.key !== key
    );

    if (recentAccesses.length > 0) {
      const prevKey = recentAccesses[recentAccesses.length - 1].key;
      
      if (!this.patterns.has(prevKey)) {
        this.patterns.set(prevKey, new Map());
      }
      
      const transitions = this.patterns.get(prevKey)!;
      transitions.set(key, (transitions.get(key) || 0) + 1);
    }
  }

  /**
   * Predict next accesses based on current access
   * Returns list of keys that should be warmed
   */
  predict(key: string): string[] {
    if (!this.patterns.has(key)) {
      return [];
    }

    const transitions = this.patterns.get(key)!;
    const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
    
    const predictions: AccessPattern[] = [];
    
    for (const [toKey, count] of transitions.entries()) {
      const probability = count / total;
      
      if (probability >= this.config.minConfidence) {
        predictions.push({
          from: key,
          to: toKey,
          count,
          probability
        });
      }
    }

    // Sort by probability and limit
    predictions.sort((a, b) => b.probability - a.probability);
    const result = predictions
      .slice(0, this.config.maxPredictions)
      .map(p => p.to);

    this.predictions += result.length;
    return result;
  }

  /**
   * Record that a prediction was correct
   */
  recordCorrectPrediction(): void {
    this.correctPredictions++;
  }

  /**
   * Get strongest patterns
   */
  getTopPatterns(limit: number = 10): AccessPattern[] {
    const allPatterns: AccessPattern[] = [];

    for (const [from, transitions] of this.patterns.entries()) {
      const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
      
      for (const [to, count] of transitions.entries()) {
        allPatterns.push({
          from,
          to,
          count,
          probability: count / total
        });
      }
    }

    allPatterns.sort((a, b) => b.probability - a.probability);
    return allPatterns.slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      patternsLearned: this.patterns.size,
      totalPredictions: this.predictions,
      correctPredictions: this.correctPredictions,
      accuracy: this.predictions > 0 
        ? (this.correctPredictions / this.predictions) * 100 
        : 0,
      recentAccesses: this.accessSequence.length
    };
  }

  clear(): void {
    this.patterns.clear();
    this.accessSequence = [];
    this.predictions = 0;
    this.correctPredictions = 0;
  }
}

