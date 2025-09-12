import { ApiServer } from './services/ApiServer.js';

const server = new ApiServer();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
