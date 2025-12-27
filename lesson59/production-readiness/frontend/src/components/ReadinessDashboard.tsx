import React, { useState, useEffect } from 'react';
import { AssessmentResult, CategoryScore } from '../types';
import { runAssessment, getLatestAssessment } from '../services/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';

const ReadinessDashboard: React.FC = () => {
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLatestAssessment();
  }, []);

  const loadLatestAssessment = async () => {
    try {
      const latest = await getLatestAssessment();
      if (latest) {
        setAssessment(latest);
      }
    } catch (err) {
      console.error('Failed to load assessment:', err);
    }
  };

  const handleRunAssessment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await runAssessment();
      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'ready': '#10b981',
      'needs-attention': '#f59e0b',
      'not-ready': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getCategoryColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pass': '#10b981',
      'warning': '#f59e0b',
      'fail': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const renderScoreGauge = (score: number) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'}
          strokeWidth="20"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)"
          strokeLinecap="round"
        />
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="32"
          fontWeight="bold"
          fill="#1f2937"
        >
          {score.toFixed(0)}
        </text>
        <text
          x="100"
          y="130"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill="#6b7280"
        >
          Score
        </text>
      </svg>
    );
  };

  const radarData = assessment?.categoryScores.map(cs => ({
    category: cs.category,
    score: cs.score
  })) || [];

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Production Readiness Assessment
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Comprehensive validation of system readiness for production deployment
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={handleRunAssessment}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {loading ? 'Running Assessment...' : 'Run Production Readiness Assessment'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '30px'
        }}>
          <p style={{ color: '#dc2626', fontWeight: '600' }}>Error: {error}</p>
        </div>
      )}

      {assessment && (
        <>
          {/* Overall Status Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  Overall Status
                </h2>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  backgroundColor: getStatusColor(assessment.status) + '20',
                  color: getStatusColor(assessment.status),
                  fontWeight: '600',
                  fontSize: '18px'
                }}>
                  {assessment.status.toUpperCase().replace('-', ' ')}
                </div>
                <div style={{ marginTop: '16px', color: '#6b7280' }}>
                  <p>Assessment ID: {assessment.id}</p>
                  <p>Duration: {(assessment.duration / 1000).toFixed(2)}s</p>
                  <p>Completed: {new Date(assessment.endTime).toLocaleString()}</p>
                </div>
              </div>
              <div>
                {renderScoreGauge(assessment.overallScore)}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
              Category Scores
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {assessment.categoryScores.map((cs: CategoryScore) => (
                <div key={cs.category} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{cs.category}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getCategoryColor(cs.status) + '20',
                      color: getCategoryColor(cs.status)
                    }}>
                      {cs.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${cs.score}%`,
                        height: '100%',
                        backgroundColor: getCategoryColor(cs.status),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                    <span>Score: {cs.score.toFixed(1)}%</span>
                    <span>Passed: {cs.checksPassed}/{cs.checksCompleted}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
              Assessment Overview
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280' }} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Failed Checks */}
          {assessment.checks.filter(c => !c.passed).length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                Issues Requiring Attention
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {assessment.checks.filter(c => !c.passed).map(check => (
                  <div key={check.checkId} style={{
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#fef2f2'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>{check.checkId}</span>
                      <span style={{ marginLeft: '12px', color: '#6b7280' }}>Score: {check.score.toFixed(0)}/100</span>
                    </div>
                    {check.findings.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Findings:</p>
                        <ul style={{ marginLeft: '20px', color: '#4b5563' }}>
                          {check.findings.map((f, idx) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {check.recommendations.length > 0 && (
                      <div>
                        <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Recommendations:</p>
                        <ul style={{ marginLeft: '20px', color: '#4b5563' }}>
                          {check.recommendations.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReadinessDashboard;
