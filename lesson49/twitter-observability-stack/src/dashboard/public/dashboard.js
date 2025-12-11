// Dashboard JavaScript for real-time data fetching

const API_BASE = window.location.origin;
const REFRESH_INTERVAL = 5000; // 5 seconds

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadSLOStatus();
    loadPredictions();
    
    // Set up auto-refresh
    setInterval(() => {
        loadSLOStatus();
        loadPredictions();
    }, REFRESH_INTERVAL);
});

// Check API health
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/health`);
        const data = await response.json();
        
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDot = statusIndicator.querySelector('.status-dot');
        
        if (data.status === 'healthy') {
            statusDot.style.background = '#00ba7c';
            statusText.textContent = 'System Healthy';
        } else {
            statusDot.style.background = '#ffad1f';
            statusText.textContent = 'System Warning';
        }
    } catch (error) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDot = statusIndicator.querySelector('.status-dot');
        
        statusDot.style.background = '#e0245e';
        statusText.textContent = 'System Offline';
        console.error('Health check failed:', error);
    }
}

// Load SLO Status
async function loadSLOStatus() {
    const container = document.getElementById('sloContainer');
    
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/slo-status`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">No SLO data available</div>';
            return;
        }
        
        container.innerHTML = data.map(slo => {
            const percentage = (slo.current / slo.target) * 100;
            const statusClass = slo.status === 'healthy' ? 'healthy' : 
                               slo.status === 'warning' ? 'warning' : 'critical';
            const progressClass = percentage >= 90 ? '' : 
                                 percentage >= 80 ? 'warning' : 'critical';
            
            return `
                <div class="slo-item ${slo.status}">
                    <div class="slo-header">
                        <div class="slo-name">${formatSLOName(slo.name)}</div>
                        <div class="slo-status ${slo.status}">${slo.status}</div>
                    </div>
                    <div class="slo-progress">
                        <div class="slo-progress-bar">
                            <div class="slo-progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="slo-metrics">
                            <span>Current: ${formatSLOValue(slo.name, slo.current)}</span>
                            <span>Target: ${formatSLOValue(slo.name, slo.target)}</span>
                            <span>Compliance: ${percentage.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<div class="loading">Error loading SLO status. Make sure the API server is running.</div>';
        console.error('Error loading SLO status:', error);
    }
}

// Load Predictions
async function loadPredictions() {
    const container = document.getElementById('predictionsContainer');
    
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/predictions`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">No predictions available. System is operating normally.</div>';
            return;
        }
        
        container.innerHTML = data.map(pred => {
            const timeToThreshold = pred.timeToThreshold < 60 
                ? `${pred.timeToThreshold.toFixed(1)} minutes`
                : `${(pred.timeToThreshold / 60).toFixed(1)} hours`;
            
            return `
                <div class="prediction-item">
                    <div class="prediction-header">
                        <div class="prediction-metric">⚠️ ${formatMetricName(pred.metric)}</div>
                        <div class="prediction-confidence">${(pred.confidence * 100).toFixed(1)}% Confidence</div>
                    </div>
                    <div class="prediction-details">
                        <div class="prediction-detail">
                            <div class="prediction-detail-label">Current Value</div>
                            <div class="prediction-detail-value">${formatMetricValue(pred.metric, pred.currentValue)}</div>
                        </div>
                        <div class="prediction-detail">
                            <div class="prediction-detail-label">Predicted Value</div>
                            <div class="prediction-detail-value">${formatMetricValue(pred.metric, pred.predictedValue)}</div>
                        </div>
                        <div class="prediction-detail">
                            <div class="prediction-detail-label">Time to Threshold</div>
                            <div class="prediction-detail-value">${timeToThreshold}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<div class="loading">Error loading predictions. Make sure the API server is running.</div>';
        console.error('Error loading predictions:', error);
    }
}

// Format helper functions
function formatSLOName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatSLOValue(name, value) {
    if (name.includes('latency')) {
        return `${(value * 1000).toFixed(0)}ms`;
    } else if (name.includes('rate') || name.includes('success')) {
        return `${value.toFixed(2)}%`;
    }
    return value.toFixed(2);
}

function formatMetricName(metric) {
    return metric
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatMetricValue(metric, value) {
    if (metric.includes('latency')) {
        return `${(value * 1000).toFixed(0)}ms`;
    } else if (metric.includes('rate')) {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(3);
}


