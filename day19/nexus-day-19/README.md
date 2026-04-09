# Day 19 — Vector quantization (SQ / PQ)

## Prerequisites

- Node.js 20+

## Layout

This folder is created by `generate_lesson_files_day19.sh` (or ships with the course repo).

From the parent **`day19`** directory:

```bash
bash setup.sh --day 19
```

## Run (this directory)

```bash
bash start.sh
npm test
npm start
```

- Dashboard default: `http://localhost:3190` (override with `PORT=...`).
- Seed + quantization benchmark: `npm run demo`

## Cleanup / Docker

```bash
bash cleanup.sh
```

## Optional: Ollama embeddings

```bash
docker compose up -d ollama
export NEXUS_MODE=ollama NEXUS_URL=http://localhost:11434
export NEXUS_MODEL=nomic-embed-text
npm start
```
