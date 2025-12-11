# Observability Dashboard

## Overview

The Observability Dashboard is a comprehensive web-based interface that provides real-time monitoring and visualization of all observability operations in the Twitter Clone system.

## Features

### 1. **Real-time Monitoring**
   - System health status indicator
   - Live SLO compliance tracking
   - ML-based predictive alerts

### 2. **SLO Status Dashboard**
   - Visual progress indicators for each SLO
   - Current vs Target metrics
   - Compliance percentage
   - Status indicators (Healthy/Warning/Critical)

### 3. **ML Predictions**
   - Real-time anomaly predictions
   - Time-to-threshold estimates
   - Confidence scores
   - Current vs predicted values

### 4. **Prometheus Query Examples**
   - Request rate queries
   - Latency percentile calculations
   - Error rate monitoring
   - SLI compliance queries
   - Cache performance metrics
   - Active connections tracking

### 5. **Grafana Visualization Demos**
   - Request rate over time (bar chart)
   - Latency percentiles (line graph)
   - SLO compliance (gauge)
   - Error rate trends (line graph with spikes)
   - Cache performance (pie chart)
   - Active connections (stat panel)

### 6. **API Operations Overview**
   - Complete list of all API endpoints
   - HTTP methods (GET/POST)
   - Operation descriptions
   - Feature tags (Tracing, SLO, ML, etc.)

## Starting the Dashboard

### Prerequisites
1. The main API server must be running on port 3000
2. Build the project: `npm run build`

### Start Dashboard
```bash
# Option 1: Using the script
./start-dashboard.sh

# Option 2: Using npm
npm run start:dashboard

# Option 3: Development mode
npm run dev:dashboard
```

### Access
Open your browser and navigate to: **http://localhost:8080**

## Architecture

The dashboard consists of:

1. **Backend Server** (`src/dashboard/server.ts`)
   - Express.js server on port 8080
   - API proxy endpoints to fetch data from main API
   - Static file serving

2. **Frontend** (`src/dashboard/public/`)
   - `index.html` - Main dashboard page
   - `styles.css` - Modern, professional styling
   - `dashboard.js` - Real-time data fetching and updates

3. **Data Flow**
   ```
   Dashboard (8080) → API Proxy → Main API (3000) → Data
   ```

## API Endpoints (Dashboard)

- `GET /` - Dashboard homepage
- `GET /api/dashboard/health` - Proxy to main API health check
- `GET /api/dashboard/slo-status` - Proxy to SLO status endpoint
- `GET /api/dashboard/predictions` - Proxy to ML predictions endpoint
- `GET /api/dashboard/metrics` - Proxy to Prometheus metrics endpoint

## Auto-refresh

The dashboard automatically refreshes data every 5 seconds to show real-time updates.

## Integration with Observability Stack

The dashboard integrates with:
- ✅ OpenTelemetry (via API endpoints)
- ✅ SLI/SLO Manager (real-time status)
- ✅ ML Predictor (predictive alerts)
- ✅ Prometheus (metrics examples)
- ✅ Grafana (visualization examples)

Note: The Prometheus and Grafana sections show **examples and demos** only. They are not directly integrated but demonstrate how to use the data in those tools.

## Customization

### Changing Port
Set the `DASHBOARD_PORT` environment variable:
```bash
DASHBOARD_PORT=9000 npm run start:dashboard
```

### Changing API URL
Set the `API_URL` environment variable:
```bash
API_URL=http://localhost:4000 npm run start:dashboard
```

## Troubleshooting

### Dashboard shows "System Offline"
- Ensure the main API server is running on port 3000
- Check that the API is accessible: `curl http://localhost:3000/health`

### Static files not loading
- Run `npm run build` to copy dashboard files to dist/
- Or manually run `npm run copy-dashboard`

### Port already in use
- Change the port using `DASHBOARD_PORT` environment variable
- Or stop the process using port 8080


