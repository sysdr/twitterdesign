# Twitter Geographic Distribution System

A comprehensive system for managing Twitter's geographic distribution across multiple regions with real-time monitoring, traffic routing, and compliance management.

## Features

- **Geographic Distribution**: Multi-region deployment across Asia-Pacific, EU-Central, and US-East
- **Real-time Monitoring**: Dashboard for monitoring regional performance and health
- **Traffic Routing**: Intelligent traffic routing based on geographic proximity and load
- **Compliance Management**: Regional compliance monitoring and enforcement
- **CDN Integration**: Content delivery network optimization
- **Docker Support**: Containerized deployment with Docker and Docker Compose

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Dashboard/          # Real-time monitoring dashboard
│   │   ├── RegionMonitor/     # Regional health monitoring
│   │   └── TrafficRouter/     # Traffic routing logic
│   ├── services/
│   │   ├── cdn.ts            # CDN service integration
│   │   ├── compliance.ts     # Compliance management
│   │   └── geographic.ts     # Geographic distribution logic
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── regions/                  # Regional configuration directories
│   ├── asia-pacific/
│   ├── eu-central/
│   └── us-east/
├── tests/                    # Test files
├── public/                   # Static assets
├── docker/                   # Docker configuration files
└── scripts/                  # Utility scripts
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd twitter-geographic-distribution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Stop the containers:
   ```bash
   docker-compose down
   ```

### Testing

Run the test suite:
```bash
npm test
```

## Configuration

### Regional Setup

The system supports three main regions:
- **Asia-Pacific**: Optimized for APAC users
- **EU-Central**: Compliant with GDPR and EU regulations
- **US-East**: Primary US deployment

### Environment Variables

Create a `.env` file with the following variables:
```env
NODE_ENV=development
PORT=3000
REGION=us-east
CDN_ENDPOINT=your-cdn-endpoint
COMPLIANCE_API_KEY=your-compliance-api-key
```

## API Endpoints

- `GET /api/health` - System health check
- `GET /api/regions` - List all regions
- `GET /api/regions/:region/status` - Regional status
- `POST /api/traffic/route` - Route traffic to optimal region

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
