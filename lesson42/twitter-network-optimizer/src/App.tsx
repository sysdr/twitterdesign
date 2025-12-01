import React, { useEffect, useRef, useState } from 'react';
import { NetworkDashboard } from './components/NetworkDashboard';
import { NetworkOptimizer } from './services/NetworkOptimizer';
import { Play, Pause } from 'lucide-react';

const App: React.FC = () => {
  // Initialize optimizer immediately, not in useEffect
  const optimizerRef = useRef<NetworkOptimizer>(new NetworkOptimizer(100));
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize with some sample metrics to show non-zero values on dashboard
    const initMetrics = async () => {
      try {
        // Generate a few initial metrics to populate the dashboard
        for (let i = 0; i < 5; i++) {
          await optimizerRef.current.sendData(
            'Initial sample data',
            'text',
            { rtt: 50 + Math.random() * 10, loss: 0.5, bandwidth: 100 }
          );
        }
      } catch (error) {
        console.error('Error initializing metrics:', error);
      }
    };
    
    // Don't await - let it run in background
    initMetrics();
  }, []);

  const startSimulation = () => {
    if (!optimizerRef.current) return;

    setIsSimulating(true);
    const simulate = async () => {
      if (!optimizerRef.current) return;

      // Simulate different types of traffic
      const trafficTypes = [
        { data: 'Tweet text content...', class: 'text', conditions: { rtt: 45, loss: 0.5, bandwidth: 100 } },
        { data: 'Image data...'.repeat(100), class: 'media', conditions: { rtt: 60, loss: 1.2, bandwidth: 80 } },
        { data: 'Video chunk...'.repeat(500), class: 'video', conditions: { rtt: 55, loss: 0.8, bandwidth: 90 } },
        { data: 'Analytics ping', class: 'analytics', conditions: { rtt: 50, loss: 0.3, bandwidth: 100 } }
      ];

      const randomTraffic = trafficTypes[Math.floor(Math.random() * trafficTypes.length)];
      await optimizerRef.current.sendData(
        randomTraffic.data,
        randomTraffic.class,
        randomTraffic.conditions
      );

      if (isSimulating) {
        simulationRef.current = window.setTimeout(simulate, 100);
      }
    };

    simulate();
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationRef.current) {
      clearTimeout(simulationRef.current);
      simulationRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearTimeout(simulationRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={isSimulating ? stopSimulation : startSimulation}
          style={{
            padding: '12px 24px',
            backgroundColor: isSimulating ? '#F45D22' : '#1DA1F2',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {isSimulating ? (
            <>
              <Pause size={20} />
              Stop Simulation
            </>
          ) : (
            <>
              <Play size={20} />
              Start Simulation
            </>
          )}
        </button>
      </div>
      <NetworkDashboard optimizer={optimizerRef.current} />
    </div>
  );
};

export default App;
