const { admin, topics } = require('../../config/kafka');

async function setupKafka() {
  try {
    console.log('🔧 Setting up Kafka topics...');
    
    await admin.connect();
    
    // Check existing topics
    const existingTopics = await admin.listTopics();
    const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic.topic));
    
    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate
      });
      console.log(`✅ Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
    } else {
      console.log('✅ All topics already exist');
    }
    
    // Describe topics for verification
    for (const topic of topics) {
      const metadata = await admin.fetchTopicMetadata({ topics: [topic.topic] });
      const topicMetadata = metadata.topics[0];
      console.log(`📊 Topic ${topic.topic}: ${topicMetadata.partitions.length} partitions`);
    }
    
    await admin.disconnect();
    
  } catch (error) {
    console.error('❌ Kafka setup failed:', error);
    throw error;
  }
}

module.exports = {
  setupKafka
};
