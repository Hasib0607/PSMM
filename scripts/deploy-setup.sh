#!/usr/bin/env bash
# Runs on every deploy build — creates/updates DB tables and seeds special days.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set in .env"
  echo "Add PostgreSQL connection string, e.g.:"
  echo '  DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/psmm"'
  echo ""
  exit 1
fi

echo "==> Prisma: pushing schema to database..."
npx prisma db push

echo "==> Prisma: seeding special days..."
npx prisma db seed

echo "==> Database setup complete."
