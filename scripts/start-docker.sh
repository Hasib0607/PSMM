#!/usr/bin/env bash
# Start PostgreSQL + Redis via Docker (VPS). Run once before first deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Starting PostgreSQL + Redis..."
docker compose up -d

echo ""
echo "==> Use this DATABASE_URL in your .env (if using defaults):"
echo 'DATABASE_URL="postgresql://psmm:psmm@127.0.0.1:5432/psmm"'
echo 'REDIS_URL="redis://127.0.0.1:6379"'
echo ""
echo "To change password, set POSTGRES_PASSWORD in .env before running this script."
