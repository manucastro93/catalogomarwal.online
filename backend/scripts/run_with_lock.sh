#!/usr/bin/env bash
set -euo pipefail

LOCK_NAME="$1"; shift
LOCK_FILE="/tmp/${LOCK_NAME}.lock"

# -n: no espera (si está corriendo, sale); -w 0: cero segundos de espera
# ejecuta el resto del comando bajo el candado
exec /usr/bin/flock -n -w 0 "$LOCK_FILE" -- "$@"
