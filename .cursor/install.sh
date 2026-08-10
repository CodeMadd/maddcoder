#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agents.
# Installs the PostgreSQL system dependency (missing from the default image),
# project dependencies, applies migrations, and seeds demo data.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# --- System dependency: PostgreSQL -----------------------------------------
if ! command -v pg_ctl >/dev/null 2>&1 && ! ls /usr/lib/postgresql/*/bin/pg_ctl >/dev/null 2>&1; then
  echo "[install] Installing PostgreSQL…"
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends postgresql postgresql-contrib
fi

# --- Local, secret-free env defaults (mock AI + local storage + local DB) ---
if [ ! -f .env ]; then
  cp .env.example .env
fi

# --- Node dependencies ------------------------------------------------------
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npx prisma generate

# --- Database: start local cluster, migrate, seed ---------------------------
bash scripts/pg.sh start
npx prisma migrate deploy
npm run db:seed || true
