import { VectorClockUtil } from '../../utils/vectorClock';
import { VectorClock } from '../../types';

describe('VectorClockUtil', () => {
  test('increment should increase region counter', () => {
    const clock: VectorClock = { 'us-east': 1, 'eu-west': 2 };
    const incremented = VectorClockUtil.increment(clock, 'us-east');
    
    expect(incremented['us-east']).toBe(2);
    expect(incremented['eu-west']).toBe(2);
  });

  test('merge should take maximum values', () => {
    const clock1: VectorClock = { 'us-east': 3, 'eu-west': 1 };
    const clock2: VectorClock = { 'us-east': 1, 'eu-west': 4, 'asia-pacific': 2 };
    
    const merged = VectorClockUtil.merge(clock1, clock2);
    
    expect(merged['us-east']).toBe(3);
    expect(merged['eu-west']).toBe(4);
    expect(merged['asia-pacific']).toBe(2);
  });

  test('compare should detect causality', () => {
    const clock1: VectorClock = { 'us-east': 1, 'eu-west': 1 };
    const clock2: VectorClock = { 'us-east': 2, 'eu-west': 1 };
    
    expect(VectorClockUtil.compare(clock1, clock2)).toBe('BEFORE');
    expect(VectorClockUtil.compare(clock2, clock1)).toBe('AFTER');
  });

  test('compare should detect concurrent events', () => {
    const clock1: VectorClock = { 'us-east': 2, 'eu-west': 1 };
    const clock2: VectorClock = { 'us-east': 1, 'eu-west': 2 };
    
    expect(VectorClockUtil.compare(clock1, clock2)).toBe('CONCURRENT');
  });
});
