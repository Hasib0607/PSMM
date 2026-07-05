#!/usr/bin/env bash
# Creates/updates DB tables and seeds data — runs on `npm start`, not during build.
set -euo pipefail

if [ "${SKIP_DB_SETUP:-}" = "true" ]; then
  echo "==> SKIP_DB_SETUP=true — skipping database setup."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set."
  echo "Add to server .env file, e.g.:"
  echo '  DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE_NAME"'
  echo ""
  exit 1
fi

echo "==> Prisma: pushing schema to database..."
if ! npx prisma db push 2>&1; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "DATABASE SETUP FAILED"
  echo ""
  echo "Common fixes:"
  echo "  1. Hosting panel থেকে PostgreSQL database + user create করো"
  echo "  2. .env এ DATABASE_URL সেই user/password দিয়ে set করো"
  echo "  3. Docker use করলে: docker compose up -d && password match করো"
  echo ""
  echo "P1000 = wrong username or password in DATABASE_URL"
  echo "P1001 = PostgreSQL server not running / wrong host"
  echo "Example:"
  echo '  DATABASE_URL="postgresql://myuser:mypassword@127.0.0.1:5432/psmm"'
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo "==> Prisma: seeding special days..."
npx prisma db seed

echo "==> Database setup complete."
