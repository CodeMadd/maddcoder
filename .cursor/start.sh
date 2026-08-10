#!/usr/bin/env bash
# Per-boot reconciliation: ensure the local PostgreSQL cluster is running.
# Idempotent — safe to run on every environment start.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
bash scripts/pg.sh start
