import { useEffect } from 'react';
import { useLoadBalancer } from './hooks/useLoadBalancer';
import { Dashboard } from './components/Dashboard';
import { HashRingVisualization } from './components/HashRingVisualization';

function App() {
  const {
    servers,
    metrics,
    history,
    isRunning,
    addServer,
    sendBatch,
    startSimulation,
    stopSimulation,
    reset,
    loadDemoData
  } = useLoadBalancer({
    epsilon: 0.25,
    updateInterval: 500
  });

  // Initialize servers and load demo data
  useEffect(() => {
    const initialServers = [
      { id: 's1', name: 'Server-1', capacity: 100, currentLoad: 0, cpu: 20, memory: 30, responseTime: 10, weight: 1.0 },
      { id: 's2', name: 'Server-2', capacity: 150, currentLoad: 0, cpu: 25, memory: 35, responseTime: 12, weight: 1.5 },
      { id: 's3', name: 'Server-3', capacity: 200, currentLoad: 0, cpu: 15, memory: 25, responseTime: 8, weight: 2.0 },
      { id: 's4', name: 'Server-4', capacity: 100, currentLoad: 0, cpu: 30, memory: 40, responseTime: 15, weight: 1.0 },
      { id: 's5', name: 'Server-5', capacity: 250, currentLoad: 0, cpu: 10, memory: 20, responseTime: 5, weight: 2.5 },
    ];

    initialServers.forEach(server => {
      addServer(server);
    });

    // Load demo data after a short delay to ensure servers are initialized
    setTimeout(() => {
      loadDemoData();
    }, 100);
  }, [addServer, loadDemoData]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Load Balancing Mathematics
          </h1>
          <p className="text-gray-600 mt-2">
            Weighted Consistent Hashing with Bounded Loads
          </p>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Dashboard
              servers={servers}
              metrics={metrics}
              history={history}
              isRunning={isRunning}
              onStart={startSimulation}
              onStop={stopSimulation}
              onReset={reset}
              onSendBatch={sendBatch}
              onLoadDemoData={loadDemoData}
            />
          </div>
          <div>
            <HashRingVisualization servers={servers} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
