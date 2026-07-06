#!/usr/bin/env bash
# One-command production setup for shared/VPS hosting.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

prompt() {
  local label="$1"
  local default_value="${2:-}"
  local value=""

  if [ -n "$default_value" ]; then
    read -r -p "$label [$default_value]: " value
    echo "${value:-$default_value}"
  else
    read -r -p "$label: " value
    echo "$value"
  fi
}

prompt_secret() {
  local label="$1"
  local value=""
  read -r -s -p "$label: " value
  echo ""
  echo "$value"
}

generate_base64_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32
  else
    node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
  fi
}

generate_hex_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  fi
}

shell_quote() {
  printf "'%s'" "$(printf "%s" "$1" | sed "s/'/'\\\\''/g")"
}

build_database_url() {
  node -e '
const [user, password, host, port, database] = process.argv.slice(1);
const enc = encodeURIComponent;
console.log(`postgresql://${enc(user)}:${enc(password)}@${host}:${port}/${enc(database)}`);
' "$1" "$2" "$3" "$4" "$5"
}

echo "==> PSMM server setup"
echo "This creates .env, then creates/updates database tables."
echo ""

APP_URL="$(prompt "App URL" "https://me.ecommercex.store")"
DB_NAME="$(prompt "Database name" "ecommercex_me")"
DB_USER="$(prompt "Database user" "$DB_NAME")"
DB_HOST="$(prompt "Database host" "127.0.0.1")"
DB_PORT="$(prompt "Database port" "5432")"
DB_PASSWORD="$(prompt_secret "Database password")"

if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: Database password is required."
  exit 1
fi

DATABASE_URL="$(build_database_url "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT" "$DB_NAME")"
AUTH_SECRET="$(generate_base64_secret)"
ENCRYPTION_KEY="$(generate_hex_secret)"

if [ -f ".env" ]; then
  BACKUP=".env.backup.$(date +%Y%m%d%H%M%S)"
  cp .env "$BACKUP"
  echo "==> Existing .env backed up to $BACKUP"
fi

{
  echo "NODE_ENV=production"
  printf "AUTH_URL="
  shell_quote "$APP_URL"
  echo ""
  echo "AUTH_TRUST_HOST=true"
  echo ""
  printf "DATABASE_URL="
  shell_quote "$DATABASE_URL"
  echo ""
  echo "REDIS_URL='redis://127.0.0.1:6379'"
  echo ""
  printf "AUTH_SECRET="
  shell_quote "$AUTH_SECRET"
  echo ""
  printf "ENCRYPTION_KEY="
  shell_quote "$ENCRYPTION_KEY"
  echo ""
  echo ""
  echo "OPENAI_API_KEY=''"
  echo "TELEGRAM_BOT_TOKEN=''"
  echo "TELEGRAM_CHAT_ID=''"
  echo ""
  echo "DISABLE_EMBEDDED_WORKER=true"
  echo "PAUSE_AUTOMATION=false"
} > .env

chmod 600 .env

echo "==> .env created."
echo "==> Running database setup..."
bash scripts/deploy-setup.sh

echo ""
echo "==> Setup complete. Start the app with:"
echo "    npm start"
