import React, { useState, useEffect } from 'react';
import { TrafficRouter } from '../TrafficRouter/TrafficRouter';
import { RegionMonitor } from '../RegionMonitor/RegionMonitor';
import { GeographicService } from '../../services/geographic';
import { ComplianceService } from '../../services/compliance';
import { CDNService } from '../../services/cdn';

export const Dashboard: React.FC = () => {
  const [services] = useState(() => ({
    geographic: new GeographicService(),
    compliance: new ComplianceService(),
    cdn: new CDNService()
  }));

  const [cacheStats, setCacheStats] = useState<any>({});

  useEffect(() => {
    const updateStats = () => {
      setCacheStats(services.cdn.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [services]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#e3f2fd', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1976d2', margin: 0 }}>🌍 Twitter Geographic Distribution System</h1>
        <p style={{ color: '#666', margin: '10px 0 0 0' }}>
          Multi-Region Architecture with Intelligent Traffic Routing
        </p>
      </header>

      <div style={{ display: 'grid', gap: '20px' }}>
        <TrafficRouter 
          geographicService={services.geographic}
          complianceService={services.compliance}
        />
        
        <RegionMonitor geographicService={services.geographic} />
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>📦 CDN Cache Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {Object.entries(cacheStats).map(([region, stats]: [string, any]) => (
              <div key={region} style={{
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4>{region.toUpperCase()}</h4>
                <div>Cache Size: {stats.size} items</div>
                <div>Hit Rate: {Math.round(stats.hitRate * 100) / 100}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
