# Twitter MVP - CI/CD and Blue-Green Deployment

Production-ready Twitter clone with automated deployment pipeline.

## Quick Start

```bash
# Start the system
./start.sh

# Demo blue-green deployment
./scripts/deploy/blue-green-deploy.sh blue
./scripts/deploy/blue-green-deploy.sh green

# Stop the system
./stop.sh
```

## Architecture

- **Blue-Green Deployment**: Zero-downtime deployments
- **Load Balancer**: Nginx routing traffic between environments
- **Monitoring**: Prometheus + Grafana for observability
- **CI/CD**: GitHub Actions automated pipeline

## Access Points

- Load Balancer: http://localhost
- Blue Environment: http://localhost:3001
- Green Environment: http://localhost:3002
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

## Testing

```bash
# Health checks
curl http://localhost/api/health

# Integration tests
./scripts/test/integration-test.sh
```
