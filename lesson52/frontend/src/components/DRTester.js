import React, { useState } from 'react';
import axios from 'axios';

function DRTester({ history, onRefresh }) {
  const [running, setRunning] = useState(false);

  const runTest = async () => {
    setRunning(true);
    try {
      await axios.post('http://localhost:3001/api/dr-test/run');
      onRefresh();
    } catch (error) {
      console.error('DR test failed:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span>🧪</span> DR Testing
        </h2>
        <button 
          className="btn btn-primary"
          onClick={runTest}
          disabled={running || history.isTestRunning}
        >
          {running ? 'Running Test...' : 'Run DR Drill'}
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-label">Total Tests</div>
          <div className="stat-value">{history.totalTests}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value">{history.successRate}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Avg RTO</div>
          <div className="stat-value">
            {(history.averageRTO / 1000 / 60).toFixed(2)}
            <span className="stat-unit">min</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{fontSize: '16px'}}>
            {history.isTestRunning ? '🔄 Testing' : '✓ Ready'}
          </div>
        </div>
      </div>

      {history.tests.length > 0 && (
        <div style={{marginTop: '20px'}}>
          <h3 style={{fontSize: '14px', marginBottom: '10px', color: '#666'}}>
            Recent Test Results
          </h3>
          {history.tests.slice(-2).reverse().map((test, idx) => (
            <div key={idx} className="test-result">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                <span style={{fontWeight: '600'}}>
                  {test.success ? '✓' : '✗'} {test.testId}
                </span>
                <span style={{fontSize: '12px', color: '#666'}}>
                  {new Date(test.startTime).toLocaleString()}
                </span>
              </div>
              <div className="test-phases">
                {test.phases && test.phases.map((phase, pidx) => (
                  <div key={pidx} className="phase-item">
                    {phase.name}: {(phase.duration / 1000).toFixed(2)}s
                    {phase.rto && ` (RTO: ${(phase.rto / 1000 / 60).toFixed(2)}m)`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DRTester;
