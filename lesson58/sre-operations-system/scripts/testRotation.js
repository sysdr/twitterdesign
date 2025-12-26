import { OnCallService } from '../src/services/onCallService.js';

async function testRotation() {
  console.log('Testing on-call rotation generation...');
  
  const schedules = await OnCallService.generateRotation(30);
  console.log(`✓ Generated ${schedules.length} rotation schedules`);
  
  // Verify no back-to-back shifts
  const engineers = new Map();
  for (const schedule of schedules) {
    const prev = engineers.get(schedule.engineerId);
    if (prev && Math.abs(schedule.startTime - prev.endTime) < 24 * 60 * 60 * 1000) {
      console.error('✗ Back-to-back shift detected!');
      process.exit(1);
    }
    engineers.set(schedule.engineerId, schedule);
  }
  console.log('✓ No back-to-back shifts detected');
  
  console.log('✓ All rotation tests passed!');
  process.exit(0);
}

testRotation().catch((error) => {
  console.error('Rotation test failed:', error);
  process.exit(1);
});
