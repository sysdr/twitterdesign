import { Request, Response, NextFunction } from 'express';

export class MetricsMiddleware {
  private requestCount = 0;
  private totalResponseTime = 0;
  private dataSent = 0;
  
  track = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const size = parseInt(res.get('Content-Length') || '0');
      
      this.requestCount++;
      this.totalResponseTime += duration;
      this.dataSent += size;
      
      console.log(`[METRICS] ${req.method} ${req.path} - ${duration}ms - ${size} bytes`);
    });
    
    next();
  };
  
  getStats() {
    return {
      requests: this.requestCount,
      avgResponseTime: this.requestCount > 0 
        ? Math.round(this.totalResponseTime / this.requestCount) 
        : 0,
      totalDataSent: this.dataSent,
      avgDataPerRequest: this.requestCount > 0 
        ? Math.round(this.dataSent / this.requestCount) 
        : 0
    };
  }
}
