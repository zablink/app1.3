#!/usr/bin/env bash
# รัน typecheck ใน Linux container — ใช้เมื่อ npm install บน Mac เก่าแล้ว esbuild/prisma postinstall พัง
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker run --rm \
  -v "$ROOT:/app" \
  -w /app \
  node:20-bookworm-slim \
  bash -lc 'npm install --no-fund --no-audit && npm run typecheck'
