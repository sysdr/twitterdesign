## Prerequisites
- Node.js 20+

## Quick Start
```
npm run demo
npm test
```
Requires Node.js 20+ (global `fetch` in Node).

Dashboard (refuses to start if port 3000 is already in use):
```
./start.sh
```
Equivalent: `npm start`

From the lesson bundle root (e.g. `day9/`): `bash nexus-day-09/start.sh`

**Connection refused:** start `./start.sh` first, then open **http://127.0.0.1:3000/** (the server listens on `0.0.0.0` so WSL ↔ Windows localhost forwarding works).

## Verify
```
npm test
```
Expected: `[ALL PASS] Day 09 verification complete.`

## Optional: Real Redpanda
```
docker compose up -d redpanda
export NEXUS_MODE=redpanda NEXUS_URL=http://localhost:8082
export NEXUS_ADMIN_URL=http://localhost:9644
npm run demo
```

## Cleanup

Run:

```bash
bash cleanup.sh
```

This will:
- stop local Node dashboard services
- stop/remove Docker containers
- prune unused Docker resources/images/volumes
- remove `node_modules`, `venv`, `.pytest_cache`, `.pyc`, and `*istio*` artifacts under this directory
