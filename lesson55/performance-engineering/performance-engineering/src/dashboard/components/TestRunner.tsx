import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  testResults: any[];
}

export const TestRunner: React.FC<Props> = ({ testResults }) => {
  const [running, setRunning] = useState(false);
  const [testConfig, setTestConfig] = useState({
    name: 'Custom Test',
    concurrentUsers: 500,
    duration: 60
  });

  const runTest = async () => {
    setRunning(true);
    try {
      await axios.post('http://localhost:4000/api/test/run', testConfig);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const runTestSuite = async () => {
    setRunning(true);
    try {
      await axios.post('http://localhost:4000/api/test/suite');
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="test-runner">
      <div className="test-config">
        <h3>Configure Test</h3>
        <div className="config-form">
          <label>
            Test Name:
            <input
              type="text"
              value={testConfig.name}
              onChange={(e) => setTestConfig({ ...testConfig, name: e.target.value })}
            />
          </label>
          <label>
            Concurrent Users:
            <input
              type="number"
              value={testConfig.concurrentUsers}
              onChange={(e) => setTestConfig({ ...testConfig, concurrentUsers: parseInt(e.target.value) })}
            />
          </label>
          <label>
            Duration (seconds):
            <input
              type="number"
              value={testConfig.duration}
              onChange={(e) => setTestConfig({ ...testConfig, duration: parseInt(e.target.value) })}
            />
          </label>
        </div>
        <div className="test-actions">
          <button onClick={runTest} disabled={running}>
            {running ? 'Running...' : 'Run Single Test'}
          </button>
          <button onClick={runTestSuite} disabled={running}>
            {running ? 'Running...' : 'Run Full Test Suite'}
          </button>
        </div>
      </div>

      <div className="test-results">
        <h3>Test History</h3>
        {testResults.length === 0 ? (
          <p>No test results yet. Run a test to see results.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Requests</th>
                <th>Success Rate</th>
                <th>Avg Latency</th>
                <th>P95</th>
                <th>P99</th>
                <th>Throughput</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.testName}</td>
                  <td>{result.totalRequests}</td>
                  <td>{((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%</td>
                  <td>{result.avgLatency.toFixed(1)}ms</td>
                  <td>{result.p95}ms</td>
                  <td>{result.p99}ms</td>
                  <td>{result.throughput.toFixed(1)} req/s</td>
                  <td className={result.budgetCompliance ? 'status-success' : 'status-error'}>
                    {result.budgetCompliance ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
