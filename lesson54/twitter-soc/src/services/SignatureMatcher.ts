import { SecurityEvent } from '../models/SecurityEvent';

export class SignatureMatcher {
  private sqlInjectionPatterns = [
    /(\bOR\b.*=.*)/i,
    /(UNION.*SELECT)/i,
    /(DROP.*TABLE)/i,
    /('.*OR.*'1'.*=.*'1)/i,
    /(;.*DROP)/i,
    /(EXEC.*xp_)/i
  ];

  private xssPatterns = [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i
  ];

  private pathTraversalPatterns = [
    /\.\.[\/\\]/,
    /\.\.%2[fF]/,
    /\.\.%5[cC]/
  ];

  async analyze(event: SecurityEvent): Promise<{ score: number; reason: string }> {
    const content = JSON.stringify(event.metadata);
    
    // Check SQL injection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(content)) {
        return {
          score: 1.0,
          reason: 'SQL injection pattern detected'
        };
      }
    }

    // Check XSS
    for (const pattern of this.xssPatterns) {
      if (pattern.test(content)) {
        return {
          score: 1.0,
          reason: 'XSS attack pattern detected'
        };
      }
    }

    // Check path traversal
    for (const pattern of this.pathTraversalPatterns) {
      if (pattern.test(content)) {
        return {
          score: 1.0,
          reason: 'Path traversal attack detected'
        };
      }
    }

    // Check for suspicious user agents
    if (event.userAgent.includes('sqlmap') || 
        event.userAgent.includes('nikto') ||
        event.userAgent.includes('nmap')) {
      return {
        score: 0.95,
        reason: 'Known attack tool user agent detected'
      };
    }

    return { score: 0.0, reason: 'No known attack signatures found' };
  }
}
