#!/usr/bin/env bash
# Creates/updates DB tables and seeds data — runs on `npm start`, not during build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${SKIP_DB_SETUP:-}" = "true" ]; then
  echo "==> SKIP_DB_SETUP=true — skipping database setup."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set."
  echo "Add to server .env file, e.g.:"
  echo '  DATABASE_URL="postgresql://psmm:psmm@127.0.0.1:5432/psmm"'
  echo ""
  exit 1
fi

is_local_host() {
  case "$DATABASE_URL" in
    *127.0.0.1*|*localhost*) return 0 ;;
    *) return 1 ;;
  esac
}

# Parse postgresql://user:pass@host:port/db from DATABASE_URL for Docker env
sync_docker_postgres_env() {
  if ! command -v node >/dev/null 2>&1; then
    return 0
  fi
  eval "$(node <<'NODE'
const raw = process.env.DATABASE_URL || "";
const match = raw.match(/^postgres(?:ql)?:\/\/([^:@]+)(?::([^@]*))?@[^/]+\/([^?]+)/);
if (!match) process.exit(0);
const [, user, pass = "", db] = match;
const esc = (s) => s.replace(/'/g, "'\\''");
console.log(`export POSTGRES_USER='${esc(decodeURIComponent(user))}'`);
console.log(`export POSTGRES_PASSWORD='${esc(decodeURIComponent(pass))}'`);
console.log(`export POSTGRES_DB='${esc(db)}'`);
NODE
)"
}

ensure_local_postgres() {
  if [ "${AUTO_START_DOCKER:-true}" != "true" ]; then
    return 0
  fi
  if ! is_local_host; then
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "==> Local DATABASE_URL but Docker not found — ensure PostgreSQL is running on the server."
    return 0
  fi

  sync_docker_postgres_env

  echo "==> Starting PostgreSQL + Redis via Docker (credentials from DATABASE_URL)..."
  if ! docker compose up -d postgres redis 2>&1; then
    echo "==> WARNING: docker compose failed (port 5432 in use?)."
    echo "    Use hosting panel PostgreSQL credentials in DATABASE_URL, or free port 5432."
    return 0
  fi

  echo "==> Waiting for PostgreSQL to accept connections..."
  for _ in $(seq 1 45); do
    if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-psmm}" -d "${POSTGRES_DB:-psmm}" >/dev/null 2>&1; then
      echo "==> PostgreSQL is ready."
      return 0
    fi
    sleep 1
  done
  echo "==> WARNING: PostgreSQL did not become ready in time."
}

ensure_local_postgres

echo "==> Prisma: pushing schema to database..."
if ! npx prisma db push 2>&1; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "DATABASE SETUP FAILED"
  echo ""
  echo "Common fixes:"
  echo "  1. Hosting panel থেকে PostgreSQL database + user create করো"
  echo "  2. .env এ DATABASE_URL সেই user/password দিয়ে set করো"
  echo "  3. App Docker container হলে host 127.0.0.1 না দিয়ে postgres/service name দাও"
  echo "  4. Same VPS + app host process: npm run docker:up (user/pass = DATABASE_URL এর সাথে match)"
  echo ""
  echo "P1000 = wrong username or password in DATABASE_URL"
  echo "P1001 = PostgreSQL server not running / wrong host"
  echo "Example:"
  echo '  DATABASE_URL="postgresql://psmm:psmm@127.0.0.1:5432/psmm"'
  echo '  DATABASE_URL="postgresql://psmm:psmm@postgres:5432/psmm"'
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo "==> Prisma: seeding special days..."
npx prisma db seed

echo "==> Database setup complete."
