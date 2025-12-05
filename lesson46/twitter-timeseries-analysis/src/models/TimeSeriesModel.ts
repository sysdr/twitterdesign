import { Statistics } from '../utils/statistics';

export class TimeSeriesModel {
  private history: number[] = [];
  private readonly maxHistory = 300; // 5 minutes at 1 sample/second

  addDataPoint(value: number): void {
    this.history.push(value);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getMean(): number {
    return Statistics.mean(this.history);
  }

  getStdDev(): number {
    return Statistics.standardDeviation(this.history);
  }

  getHistory(): number[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
