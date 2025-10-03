import React, { useState, useEffect } from 'react';
import { LoadGeneratorService } from '../../services/LoadGeneratorService';
import { FailoverService } from '../../services/FailoverService';
import { MetricsService } from '../../services/MetricsService';
import { LoadTestConfig, RegionalPerformance, Region } from '../../types';
import { RegionalMetrics } from './RegionalMetrics';
import { FailoverControls } from './FailoverControls';
import { GlobalMap } from './GlobalMap';

export const LoadTestDashboard: React.FC = () => {
  const [loadGenerator] = useState(new LoadGeneratorService());
  const [failoverService] = useState(new FailoverService());
  const [metricsService] = useState(new MetricsService());
  
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionalPerformance, setRegionalPerformance] = useState<RegionalPerformance[]>([]);

  useEffect(() => {
    setRegions(failoverService.getRegions());

    // Update metrics every 2 seconds
    const metricsInterval = setInterval(() => {
      const metrics = loadGenerator.getMetrics();
      metricsService.addMetrics(metrics);
      setRegionalPerformance(metricsService.getRegionalPerformance());
    }, 2000);

    // Listen for failover events
    failoverService.onFailover((regionId, status) => {
      console.log(`Failover event: ${regionId} -> ${status}`);
      setRegions([...failoverService.getRegions()]);
    });

    return () => {
      clearInterval(metricsInterval);
    };
  }, []);

  const startLoadTest = async () => {
    setIsTestRunning(true);
    
    const config: LoadTestConfig = {
      duration: 120, // 2 minutes
      concurrentUsers: 100,
      rampUpTime: 30,
      regions: regions.map(r => r.id),
      scenarios: [
        {
          id: 'timeline',
          name: 'Timeline Loading',
          actions: [
            { type: 'get', endpoint: '/api/timeline', expectedStatus: 200 }
          ],
          weight: 0.4
        },
        {
          id: 'posting',
          name: 'Tweet Posting',
          actions: [
            { type: 'post', endpoint: '/api/tweets', payload: { content: 'Test tweet' }, expectedStatus: 201 }
          ],
          weight: 0.3
        },
        {
          id: 'search',
          name: 'Search',
          actions: [
            { type: 'get', endpoint: '/api/search?q=test', expectedStatus: 200 }
          ],
          weight: 0.3
        }
      ]
    };

    // Start tests in all regions simultaneously
    const promises = regions.map(region => 
      loadGenerator.startRegionalTest(region, config)
    );

    try {
      await Promise.all(promises);
    } finally {
      setIsTestRunning(false);
    }
  };

  const stopLoadTest = () => {
    regions.forEach(region => {
      loadGenerator.stopTest(region.id);
    });
    setIsTestRunning(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#1da1f2', marginBottom: '30px' }}>
        Multi-Region Load Testing Dashboard
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Load Test Controls</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              onClick={startLoadTest}
              disabled={isTestRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: isTestRunning ? '#ccc' : '#1da1f2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isTestRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isTestRunning ? 'Test Running...' : 'Start Global Load Test'}
            </button>
            <button
              onClick={stopLoadTest}
              disabled={!isTestRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: !isTestRunning ? '#ccc' : '#e1306c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isTestRunning ? 'not-allowed' : 'pointer'
              }}
            >
              Stop Test
            </button>
          </div>
        </div>

        <FailoverControls failoverService={failoverService} />
      </div>

      <GlobalMap regions={regions} />
      
      <RegionalMetrics 
        regionalPerformance={regionalPerformance}
        isTestRunning={isTestRunning}
      />
    </div>
  );
};
