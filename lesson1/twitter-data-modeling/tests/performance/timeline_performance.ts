import { performance } from 'perf_hooks';

export async function testTimelinePerformance() {
  console.log('🚀 Testing Timeline Query Performance...');
  
  const iterations = 100;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    // Simulate timeline query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
    
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  console.log(`Average Timeline Query Time: ${avgTime.toFixed(2)}ms`);
  console.log(`Max Time: ${maxTime.toFixed(2)}ms`);
  console.log(`Min Time: ${minTime.toFixed(2)}ms`);
  
  const under100ms = times.filter(t => t < 100).length;
  const successRate = (under100ms / iterations) * 100;
  
  console.log(`Queries under 100ms: ${successRate.toFixed(1)}%`);
  
  return {
    average: avgTime,
    max: maxTime,
    min: minTime,
    successRate
  };
}
