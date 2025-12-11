import { initializeTelemetry } from './shared/telemetry';
import { startServer } from './services/api/server';

const sdk = initializeTelemetry('twitter-api-service');

startServer();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Telemetry terminated'))
    .catch((error) => console.log('Error terminating telemetry', error))
    .finally(() => process.exit(0));
});
