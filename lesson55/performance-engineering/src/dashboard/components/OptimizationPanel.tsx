import React from 'react';
import axios from 'axios';

interface Props {
  optimizations: any[];
}

export const OptimizationPanel: React.FC<Props> = ({ optimizations }) => {
  const applyOptimization = async (id: string) => {
    try {
      await axios.post(`http://localhost:4000/api/optimizations/${id}/apply`);
    } catch (error) {
      console.error('Failed to apply optimization:', error);
    }
  };

  return (
    <div className="optimization-panel">
      <h3>Recommended Optimizations</h3>
      
      {optimizations.length === 0 ? (
        <p>No optimizations available. Run performance tests to generate recommendations.</p>
      ) : (
        <div className="optimizations-list">
          {optimizations.map((opt) => (
            <div key={opt.id} className="optimization-card">
              <div className="opt-header">
                <span className={`opt-type opt-type-${opt.type}`}>{opt.type}</span>
                <span className="opt-confidence">
                  {(opt.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <div className="opt-description">{opt.description}</div>
              <div className="opt-improvement">
                Expected improvement: <strong>{opt.estimatedImprovement}%</strong>
              </div>
              <div className="opt-steps">
                <strong>Implementation Steps:</strong>
                <ol>
                  {opt.implementationSteps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="opt-actions">
                {opt.automaticApply ? (
                  <button className="btn-primary" onClick={() => applyOptimization(opt.id)}>
                    Auto-Apply
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={() => applyOptimization(opt.id)}>
                    Review & Apply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
