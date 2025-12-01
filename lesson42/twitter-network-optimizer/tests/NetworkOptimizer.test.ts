import { NetworkOptimizer } from '../src/services/NetworkOptimizer';
import { NetworkMonitor } from '../src/services/NetworkMonitor';
import { TCPOptimizer } from '../src/services/TCPOptimizer';
import { BandwidthManager } from '../src/services/BandwidthManager';

describe('NetworkOptimizer', () => {
  let optimizer: NetworkOptimizer;

  beforeEach(() => {
    optimizer = new NetworkOptimizer(100);
  });

  test('should reduce latency with optimization', async () => {
    const result = await optimizer.sendData(
      'Test tweet content',
      'text',
      { rtt: 50, loss: 1, bandwidth: 100 }
    );

    expect(result.improvement).toBeGreaterThan(0);
    expect(result.after.latency).toBeLessThan(result.before.latency);
  });

  test('should adapt TCP config based on network conditions', async () => {
    // Send data to establish baseline
    await optimizer.sendData(
      'Test',
      'text',
      { rtt: 150, loss: 2, bandwidth: 20 }
    );

    const tcpConfig = optimizer.getTCPOptimizer().getCurrentConfig();
    
    // Should detect mobile/congested network and adjust
    expect(tcpConfig.initialWindow).toBeGreaterThanOrEqual(10);
    expect(tcpConfig.fastRetransmitThreshold).toBeLessThanOrEqual(3);
  });

  test('should allocate bandwidth fairly across traffic classes', () => {
    const allocation = optimizer.getBandwidthManager().getAllocation();
    
    expect(allocation.classes.size).toBeGreaterThan(0);
    
    const textClass = allocation.classes.get('text');
    const videoClass = allocation.classes.get('video');
    
    expect(videoClass!.weight).toBeGreaterThan(textClass!.weight);
  });

  test('should calculate correct latency percentiles', async () => {
    // Generate metrics
    for (let i = 0; i < 100; i++) {
      await optimizer.sendData(
        'Test',
        'text',
        { rtt: 50 + Math.random() * 20, loss: Math.random(), bandwidth: 100 }
      );
    }

    const monitor = optimizer.getMonitor();
    const p95 = monitor.calculatePercentile(95);
    const p50 = monitor.calculatePercentile(50);

    expect(p95).toBeGreaterThan(p50);
    expect(p95).toBeGreaterThan(0);
  });

  test('should predict latency accurately', async () => {
    // Build history
    for (let i = 0; i < 50; i++) {
      await optimizer.sendData(
        'Test',
        'text',
        { rtt: 50, loss: 0.5, bandwidth: 100 }
      );
    }

    const prediction = optimizer.getPredictor().predictLatency(5, 100);
    
    expect(prediction.predictedLatency).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });
});

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    monitor = new NetworkMonitor();
  });

  test('should detect fiber network conditions', () => {
    monitor.recordMetric({
      timestamp: Date.now(),
      latency: 15,
      throughput: 1000,
      packetLoss: 0.2,
      retransmissions: 0,
      congestionWindow: 10,
      rtt: 15
    });

    const condition = monitor.detectNetworkCondition();
    expect(condition.type).toBe('fiber');
  });

  test('should detect mobile network conditions', () => {
    monitor.recordMetric({
      timestamp: Date.now(),
      latency: 80,
      throughput: 500,
      packetLoss: 1.5,
      retransmissions: 1,
      congestionWindow: 10,
      rtt: 80
    });

    const condition = monitor.detectNetworkCondition();
    expect(condition.type).toBe('mobile-4g');
  });

  test('should calculate jitter correctly', () => {
    const latencies = [50, 55, 48, 52, 51];
    latencies.forEach((lat, i) => {
      monitor.recordMetric({
        timestamp: Date.now() + i,
        latency: lat,
        throughput: 1000,
        packetLoss: 0.5,
        retransmissions: 0,
        congestionWindow: 10,
        rtt: lat
      });
    });

    const jitter = monitor.getJitter();
    expect(jitter).toBeGreaterThan(0);
    expect(jitter).toBeLessThan(10);
  });
});

describe('BandwidthManager', () => {
  let manager: BandwidthManager;

  beforeEach(() => {
    manager = new BandwidthManager(100);
  });

  test('should allocate bandwidth based on weights', () => {
    const allocation = manager.getAllocation();
    
    const text = allocation.classes.get('text')!;
    const video = allocation.classes.get('video')!;
    
    expect(video.rate).toBeGreaterThan(text.rate);
  });

  test('should implement token bucket correctly', () => {
    const canSend = manager.canSend('text', 1000);
    expect(canSend).toBe(true);
    
    manager.consumeTokens('text', 1000);
    
    const allocation = manager.getAllocation();
    const textClass = allocation.classes.get('text')!;
    expect(textClass.tokens).toBeLessThan(textClass.capacity);
  });

  test('should refill tokens over time', (done) => {
    manager.consumeTokens('text', 5000);
    const initialTokens = manager.getAllocation().classes.get('text')!.tokens;
    
    setTimeout(() => {
      manager.refillTokens();
      const newTokens = manager.getAllocation().classes.get('text')!.tokens;
      expect(newTokens).toBeGreaterThan(initialTokens);
      done();
    }, 100);
  });
});
