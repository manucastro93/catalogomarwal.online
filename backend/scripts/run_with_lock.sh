#!/usr/bin/env bash
set -euo pipefail

LOCK_NAME="${1:-}"; shift || true
if [[ -z "${LOCK_NAME}" ]]; then
  echo "❌ Falta LOCK_NAME (primer argumento)" >&2
  exit 64
fi

if [[ $# -eq 0 ]]; then
  echo "❌ No me pasaste un comando para ejecutar bajo lock" >&2
  echo "   Uso: run_with_lock.sh <lock_name> <comando> [args...]" >&2
  exit 64
fi

LOCK_FILE="/tmp/${LOCK_NAME}.lock"

# Si ya hay otro proceso con el mismo lock, no arranca
# (-n: no espera; -w 0: cero segundos)
exec /usr/bin/flock -n -w 0 "$LOCK_FILE" "$@"
