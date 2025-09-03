import React, { useState, useEffect } from 'react';
import { GeographicService } from '../../services/geographic';
import { ComplianceService } from '../../services/compliance';
import { Region, TrafficRoute } from '../../types';

interface Props {
  geographicService: GeographicService;
  complianceService: ComplianceService;
}

export const TrafficRouter: React.FC<Props> = ({ geographicService, complianceService }) => {
  const [routes, setRoutes] = useState<TrafficRoute[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    setRegions(geographicService.getRegions());
    simulateTrafficRouting();
    
    const interval = setInterval(simulateTrafficRouting, 5000);
    return () => clearInterval(interval);
  }, [geographicService]);

  const simulateTrafficRouting = () => {
    const mockUsers = [
      { id: 'user1', location: { country: 'US', lat: 40.7128, lng: -74.0060 } },
      { id: 'user2', location: { country: 'DE', lat: 50.1109, lng: 8.6821 } },
      { id: 'user3', location: { country: 'SG', lat: 1.3521, lng: 103.8198 } },
      { id: 'user4', location: { country: 'FR', lat: 48.8566, lng: 2.3522 } },
      { id: 'user5', location: { country: 'JP', lat: 35.6762, lng: 139.6503 } }
    ];

    const newRoutes = mockUsers.map(user => {
      const optimalRegion = geographicService.getOptimalRegion(user.location);
      const complianceRegion = complianceService.getDataResidencyRegion(user.location.country);
      
      return {
        userId: user.id,
        userLocation: user.location,
        assignedRegion: complianceRegion,
        backupRegions: regions
          .filter(r => r.id !== complianceRegion && r.status === 'healthy')
          .map(r => r.id),
        reason: complianceRegion !== optimalRegion.toString() ? 
          'Compliance Override' : 'Optimal Latency'
      };
    });

    setRoutes(newRoutes);
  };

  const getRegionName = (regionId: string): string => {
    return regions.find(r => r.id === regionId)?.name || regionId;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'degraded': return '#FF9800';
      case 'failing': return '#F44336';
      case 'recovering': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>🌍 Traffic Routing Dashboard</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h4>Regional Status</h4>
          {regions.map(region => (
            <div key={region.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: `2px solid ${getStatusColor(region.status)}`
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(region.status),
                marginRight: '10px'
              }}></div>
              <div>
                <strong>{region.name}</strong><br/>
                <small>Status: {region.status} | Capacity: {region.activeUsers}/{region.capacity}</small>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4>Active Routes</h4>
          {routes.map((route, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              <div><strong>User:</strong> {route.userId} ({route.userLocation.country})</div>
              <div><strong>Assigned:</strong> {getRegionName(route.assignedRegion)}</div>
              <div><strong>Reason:</strong> {route.reason}</div>
              <div><strong>Backups:</strong> {route.backupRegions.map(getRegionName).join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
