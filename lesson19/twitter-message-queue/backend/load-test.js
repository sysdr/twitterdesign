const TweetProducer = require('./src/producers/tweetProducer');
const { v4: uuidv4 } = require('uuid');

async function runLoadTest() {
  console.log('🚀 Starting load test...');
  
  const producer = new TweetProducer();
  await producer.start();
  
  const startTime = Date.now();
  const targetMessages = 10000;
  const batchSize = 100;
  let sentCount = 0;
  
  try {
    for (let i = 0; i < targetMessages; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, targetMessages - i) }, (_, j) => ({
        id: uuidv4(),
        userId: `load-user-${(i + j) % 1000}`, // Distribute across 1000 users
        username: `loaduser${(i + j) % 1000}`,
        content: `Load test message ${i + j} - ${Date.now()}`,
        timestamp: Date.now()
      }));
      
      await producer.publishBatch(batch);
      sentCount += batch.length;
      
      if (sentCount % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = sentCount / elapsed;
        console.log(`📊 Sent ${sentCount}/${targetMessages} messages (${rate.toFixed(2)} msg/s)`);
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    const finalRate = sentCount / totalTime;
    
    console.log('✅ Load test completed!');
    console.log(`📊 Final Stats:`);
    console.log(`   Messages sent: ${sentCount}`);
    console.log(`   Time taken: ${totalTime.toFixed(2)}s`);
    console.log(`   Average rate: ${finalRate.toFixed(2)} messages/second`);
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
  } finally {
    await producer.stop();
  }
}

if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = runLoadTest;
