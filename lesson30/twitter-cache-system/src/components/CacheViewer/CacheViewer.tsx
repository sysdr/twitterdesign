import React, { useState } from 'react';
import { CacheStats } from '../../types';

interface CacheViewerProps {
  stats: CacheStats;
}

export const CacheViewer: React.FC<CacheViewerProps> = ({ stats }) => {
  const [selectedTier, setSelectedTier] = useState<'L1' | 'L2' | 'L3'>('L1');

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'L1': return '#ff6b6b';
      case 'L2': return '#4ecdc4';
      case 'L3': return '#45b7d1';
      default: return '#95a5a6';
    }
  };

  const calculateUtilization = (entries: number, maxEntries: number) => {
    return Math.min((entries / maxEntries) * 100, 100);
  };

  const maxEntries = { L1: 10000, L2: 100000, L3: 1000000 };

  return (
    <div className="cache-viewer">
      <h2>🎯 Cache Hierarchy Viewer</h2>
      
      <div className="tier-selector">
        {(['L1', 'L2', 'L3'] as const).map(tier => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`tier-button ${selectedTier === tier ? 'active' : ''}`}
            style={{ 
              backgroundColor: selectedTier === tier ? getTierColor(tier) : 'transparent',
              borderColor: getTierColor(tier)
            }}
          >
            {tier} Cache
          </button>
        ))}
      </div>

      <div className="cache-visualization">
        <div className="cache-tier-display">
          <h3 style={{ color: getTierColor(selectedTier) }}>
            {selectedTier} Cache Details
          </h3>
          
          <div className="utilization-bar">
            <div className="bar-background">
              <div 
                className="bar-fill"
                style={{ 
                  width: `${calculateUtilization(stats.tierStats[selectedTier].entries, maxEntries[selectedTier])}%`,
                  backgroundColor: getTierColor(selectedTier)
                }}
              />
            </div>
            <span className="utilization-text">
              {stats.tierStats[selectedTier].entries.toLocaleString()} / {maxEntries[selectedTier].toLocaleString()} entries
              ({calculateUtilization(stats.tierStats[selectedTier].entries, maxEntries[selectedTier]).toFixed(1)}% utilized)
            </span>
          </div>

          <div className="tier-stats-grid">
            <div className="stat-box">
              <div className="stat-number">{stats.tierStats[selectedTier].hits.toLocaleString()}</div>
              <div className="stat-label">Hits</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{stats.tierStats[selectedTier].misses.toLocaleString()}</div>
              <div className="stat-label">Misses</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">
                {stats.tierStats[selectedTier].hits + stats.tierStats[selectedTier].misses > 0
                  ? ((stats.tierStats[selectedTier].hits / (stats.tierStats[selectedTier].hits + stats.tierStats[selectedTier].misses)) * 100).toFixed(1)
                  : '0'}%
              </div>
              <div className="stat-label">Hit Rate</div>
            </div>
          </div>
        </div>

        <div className="cache-hierarchy-visual">
          <div className="hierarchy-container">
            {(['L1', 'L2', 'L3'] as const).map((tier, index) => (
              <div 
                key={tier}
                className={`hierarchy-tier ${tier === selectedTier ? 'selected' : ''}`}
                style={{ borderColor: getTierColor(tier) }}
              >
                <div className="tier-header" style={{ backgroundColor: getTierColor(tier) }}>
                  {tier} Cache
                </div>
                <div className="tier-body">
                  <div className="tier-info">
                    <span className="entries-count">
                      {stats.tierStats[tier].entries.toLocaleString()} entries
                    </span>
                    <div className="tier-performance">
                      <span className="hits" style={{ color: '#4ade80' }}>
                        ✓ {stats.tierStats[tier].hits}
                      </span>
                      <span className="misses" style={{ color: '#f87171' }}>
                        ✗ {stats.tierStats[tier].misses}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="tier-utilization-mini"
                    style={{ 
                      background: `linear-gradient(to right, ${getTierColor(tier)} ${calculateUtilization(stats.tierStats[tier].entries, maxEntries[tier])}%, transparent ${calculateUtilization(stats.tierStats[tier].entries, maxEntries[tier])}%)`
                    }}
                  />
                </div>
                {index < 2 && <div className="hierarchy-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
