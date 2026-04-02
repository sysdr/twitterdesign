# Day 14 — Embeddings (text → vectors)

## Prerequisites

- Node.js 20+

## Generate this folder

From the parent **`day14`** directory:

```bash
bash setup.sh
cd nexus-day-14
```

## Run (this directory)

```bash
bash start.sh
npm test
npm start
```

- Dashboard default: `http://localhost:3140` (override with `PORT=...`).
- Full lesson seed + benchmark: `npm run demo`

## Cleanup / Docker

```bash
bash cleanup.sh
```

Stops running containers and prunes unused Docker images, networks, build cache, and anonymous volumes.

## Optional: Ollama embeddings

```bash
docker compose up -d ollama
export NEXUS_MODE=ollama NEXUS_URL=http://localhost:11434
export NEXUS_MODEL=nomic-embed-text
npm run demo
```

## Notes

- No API keys are required for the default in-process engine. For Ollama, use environment variables only—never commit secrets.
