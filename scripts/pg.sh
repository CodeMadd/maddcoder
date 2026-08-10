#!/usr/bin/env bash
# Self-contained PostgreSQL cluster manager for local/dev + Cloud Agent use.
# Runs a per-repo cluster as the current (non-root) user so no service manager
# or sudo is required at runtime. Safe to run repeatedly (idempotent).
set -euo pipefail

PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PGDATA="${PGDATA:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.pgdata}"
PGPORT="${PGPORT:-5432}"
PGSOCK="${PGSOCK:-/tmp}"
DB_NAME="${DB_NAME:-careerai}"
DB_USER="${DB_USER:-postgres}"
LOGFILE="$PGDATA/postgres.log"

export PATH="$PG_BIN:$PATH"

init_cluster() {
  if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[pg] initializing cluster at $PGDATA"
    mkdir -p "$PGDATA"
    initdb -D "$PGDATA" -U "$DB_USER" --auth=trust --auth-host=trust --auth-local=trust >/dev/null
    {
      echo "listen_addresses = 'localhost'"
      echo "port = $PGPORT"
      echo "unix_socket_directories = '$PGSOCK'"
    } >> "$PGDATA/postgresql.conf"
  fi
}

is_running() {
  pg_ctl -D "$PGDATA" status >/dev/null 2>&1
}

start_cluster() {
  if is_running; then
    echo "[pg] already running"
  else
    echo "[pg] starting cluster on port $PGPORT"
    pg_ctl -D "$PGDATA" -l "$LOGFILE" -w -o "-p $PGPORT -k $PGSOCK" start
  fi
}

ensure_db() {
  if ! psql -h "$PGSOCK" -p "$PGPORT" -U "$DB_USER" -lqt | cut -d '|' -f1 | grep -qw "$DB_NAME"; then
    echo "[pg] creating database $DB_NAME"
    createdb -h "$PGSOCK" -p "$PGPORT" -U "$DB_USER" "$DB_NAME"
  fi
}

stop_cluster() {
  if is_running; then
    pg_ctl -D "$PGDATA" -m fast stop
  else
    echo "[pg] not running"
  fi
}

case "${1:-start}" in
  start)
    init_cluster
    start_cluster
    ensure_db
    echo "[pg] ready: postgresql://$DB_USER@localhost:$PGPORT/$DB_NAME"
    ;;
  stop)
    stop_cluster
    ;;
  status)
    is_running && echo "[pg] running" || { echo "[pg] stopped"; exit 1; }
    ;;
  *)
    echo "usage: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
