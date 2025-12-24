export class QualityValidator {
  constructor() {
    this.rules = {
      schema: this.validateSchema.bind(this),
      range: this.validateRange.bind(this),
      freshness: this.validateFreshness.bind(this),
      completeness: this.validateCompleteness.bind(this)
    };
    this.validationStats = {
      total: 0,
      passed: 0,
      failed: 0
    };
  }

  async validate(event) {
    this.validationStats.total++;
    
    const results = {
      valid: true,
      checks: {},
      errors: []
    };

    // Run all validation rules
    for (const [ruleName, ruleFunc] of Object.entries(this.rules)) {
      const result = await ruleFunc(event);
      results.checks[ruleName] = result;
      
      if (!result.valid) {
        results.valid = false;
        results.errors.push(...result.errors);
      }
    }

    if (results.valid) {
      this.validationStats.passed++;
    } else {
      this.validationStats.failed++;
    }

    return results;
  }

  validateSchema(event) {
    const errors = [];
    
    if (!event.id) errors.push('Missing event.id');
    if (!event.type) errors.push('Missing event.type');
    if (!event.userId) errors.push('Missing event.userId');
    if (!event.timestamp) errors.push('Missing event.timestamp');
    if (!event.data) errors.push('Missing event.data');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateRange(event) {
    const errors = [];
    
    if (event.data.contentLength !== undefined && event.data.contentLength < 0) {
      errors.push('Invalid contentLength: must be >= 0');
    }
    
    if (event.data.contentLength > 280) {
      errors.push('Invalid contentLength: exceeds Twitter limit of 280');
    }
    
    if (event.data.likeCount !== undefined && event.data.likeCount < 0) {
      errors.push('Invalid likeCount: must be >= 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateFreshness(event) {
    const errors = [];
    const now = Date.now();
    const age = now - event.timestamp;
    
    // Data should be less than 5 minutes old
    if (age > 5 * 60 * 1000) {
      errors.push(`Data too old: ${Math.round(age / 1000)}s (max 300s)`);
    }
    
    // Data shouldn't be from the future
    if (age < -1000) {
      errors.push('Data timestamp is in the future');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateCompleteness(event) {
    const errors = [];
    
    // Check type-specific required fields
    if (event.type === 'tweet' && !event.data.content) {
      errors.push('Tweet missing content field');
    }
    
    if (event.type === 'like' && !event.data.tweetId) {
      errors.push('Like event missing tweetId');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getStats() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.total > 0
        ? ((this.validationStats.passed / this.validationStats.total) * 100).toFixed(2)
        : 100
    };
  }
}
