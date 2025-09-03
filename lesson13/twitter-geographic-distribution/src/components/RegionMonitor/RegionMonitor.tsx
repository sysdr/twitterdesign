import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GeographicService } from '../../services/geographic';
import { LatencyData } from '../../types';

interface Props {
  geographicService: GeographicService;
}

export const RegionMonitor: React.FC<Props> = ({ geographicService }) => {
  const [latencyData, setLatencyData] = useState<{ [key: string]: LatencyData[] }>({});
  const [currentLatencies, setCurrentLatencies] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const updateLatencies = () => {
      const matrix = geographicService.getLatencyMatrix();
      const data: { [key: string]: LatencyData[] } = {};
      const current: { [key: string]: number } = {};

      for (const [key, measurements] of matrix) {
        data[key] = measurements.slice(-20); // Last 20 measurements
        if (measurements.length > 0) {
          current[key] = measurements[measurements.length - 1].latency;
        }
      }

      setLatencyData(data);
      setCurrentLatencies(current);
    };

    updateLatencies();
    const interval = setInterval(updateLatencies, 2000);
    return () => clearInterval(interval);
  }, [geographicService]);

  const getLatencyColor = (latency: number): string => {
    if (latency < 50) return '#4CAF50';
    if (latency < 100) return '#FF9800';
    return '#F44336';
  };

  const formatChartData = (key: string) => {
    return latencyData[key]?.map((data, index) => ({
      time: index,
      latency: data.latency
    })) || [];
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>📊 Regional Latency Monitor</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        {Object.entries(currentLatencies).map(([route, latency]) => {
          const [from, to] = route.split('-');
          return (
            <div key={route} style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: `2px solid ${getLatencyColor(latency)}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>{from.toUpperCase()} → {to.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: getLatencyColor(latency) }}>
                {latency}ms
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h4>Latency Trends (Last 20 Measurements)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(latencyData).map((route, index) => (
              <Line
                key={route}
                data={formatChartData(route)}
                type="monotone"
                dataKey="latency"
                stroke={`hsl(${index * 60}, 70%, 50%)`}
                name={route}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
