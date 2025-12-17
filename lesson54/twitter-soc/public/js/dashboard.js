class SecurityDashboard {
    constructor() {
        this.ws = null;
        this.stats = {
            eventsProcessed: 0,
            threatsDetected: 0,
            incidentsResponded: 0,
            averageProcessingTime: 0
        };
        this.threats = [];
        this.timeline = [];
        this.initialize();
    }

    initialize() {
        this.connectWebSocket();
        this.loadInitialData();
        setInterval(() => this.updateStats(), 5000);
        setInterval(() => this.updateCompliance(), 30000);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}`);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            document.getElementById('status').style.color = '#10b981';
            document.getElementById('statusText').textContent = 'Connected';
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'threat') {
                this.handleThreatUpdate(message.data);
            }
        };

        this.ws.onclose = () => {
            document.getElementById('status').style.color = '#ef4444';
            document.getElementById('statusText').textContent = 'Disconnected';
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }

    async loadInitialData() {
        await this.updateStats();
        await this.loadThreats();
        await this.updateCompliance();
    }

    async updateStats() {
        try {
            const response = await fetch('/api/security/stats');
            this.stats = await response.json();
            this.renderStats();
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    async loadThreats() {
        try {
            const response = await fetch('/api/security/threats?limit=20');
            this.threats = await response.json();
            this.renderThreats();
        } catch (error) {
            console.error('Failed to load threats:', error);
        }
    }

    async updateCompliance() {
        try {
            const response = await fetch('/api/security/compliance/report?hours=24');
            const report = await response.json();
            this.renderCompliance(report);
        } catch (error) {
            console.error('Failed to update compliance:', error);
        }
    }

    handleThreatUpdate(data) {
        const { event, threat, response } = data;
        const normalizedEvent = {
            ...event,
            ip_address: event.ip_address || event.ipAddress || 'unknown',
            timestamp: event.timestamp || new Date().toISOString(),
            threat_score: threat.score,
            threat_type: threat.threatType,
            response_action: threat.recommendedAction
        };
        
        // Update stats
        this.stats.eventsProcessed++;
        if (threat.score >= 0.5) {
            this.stats.threatsDetected++;
        }
        if (response) {
            this.stats.incidentsResponded++;
        }
        this.renderStats();

        // Add to threats list
        if (threat.score >= 0.5) {
            this.threats.unshift({
                ...normalizedEvent
            });
            if (this.threats.length > 20) this.threats.pop();
            this.renderThreats();
        }

        // Add to timeline
        this.timeline.unshift({
            timestamp: normalizedEvent.timestamp,
            event: `${threat.threatType} detected from ${normalizedEvent.ip_address}`,
            action: response ? response.action : 'Logged'
        });
        if (this.timeline.length > 50) this.timeline.pop();
        this.renderTimeline();
    }

    renderStats() {
        document.getElementById('eventsProcessed').textContent = this.stats.eventsProcessed.toLocaleString();
        document.getElementById('threatsDetected').textContent = this.stats.threatsDetected.toLocaleString();
        document.getElementById('incidentsResponded').textContent = this.stats.incidentsResponded.toLocaleString();
        document.getElementById('avgProcessingTime').textContent = 
            `${this.stats.averageProcessingTime.toFixed(1)}ms`;
    }

    renderThreats() {
        const container = document.getElementById('threatsList');
        container.innerHTML = this.threats.map(threat => {
            const severity = threat.threat_score >= 0.9 ? 'high' : 
                           threat.threat_score >= 0.7 ? 'medium' : 'low';
            const time = new Date(threat.timestamp).toLocaleTimeString();
            
            return `
                <div class="threat-item ${severity}">
                    <div class="threat-header">
                        <span class="threat-type">${threat.threat_type || 'Unknown'}</span>
                        <span class="threat-score">${(threat.threat_score * 100).toFixed(0)}%</span>
                    </div>
                    <div class="threat-details">
                        ${time} | IP: ${threat.ip_address} | Action: ${threat.response_action}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCompliance(report) {
        const container = document.getElementById('complianceReport');
        container.innerHTML = `
            <div class="compliance-item">
                <span class="compliance-label">Total Events</span>
                <span class="compliance-value">${report.totalEvents.toLocaleString()}</span>
            </div>
            <div class="compliance-item">
                <span class="compliance-label">Threats Detected</span>
                <span class="compliance-value">${report.threatsDetected.toLocaleString()}</span>
            </div>
            <div class="compliance-item">
                <span class="compliance-label">Incidents Resolved</span>
                <span class="compliance-value">${report.incidentsResolved.toLocaleString()}</span>
            </div>
            <div class="compliance-item">
                <span class="compliance-label">Avg Response Time</span>
                <span class="compliance-value">${report.averageResponseTime.toFixed(2)}s</span>
            </div>
            <div class="compliance-item">
                <span class="compliance-label">Data Access Audits</span>
                <span class="compliance-value">${report.dataAccessAudits.toLocaleString()}</span>
            </div>
            <div class="compliance-item">
                <span class="compliance-label">Compliance Score</span>
                <span class="compliance-value">${report.complianceScore.toFixed(1)}%</span>
            </div>
        `;
    }

    renderTimeline() {
        const container = document.getElementById('threatTimeline');
        container.innerHTML = this.timeline.slice(0, 20).map(item => {
            const time = new Date(item.timestamp).toLocaleTimeString();
            return `
                <div class="timeline-item">
                    <div class="timeline-time">${time}</div>
                    <div class="timeline-event">
                        ${item.event}<br>
                        <small style="color: #666;">${item.action}</small>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new SecurityDashboard();
});
