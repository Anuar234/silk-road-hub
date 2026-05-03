#!/bin/sh
# pg_dump runner for the docker-compose `backup` service and ad-hoc make targets.
#
# Loops indefinitely when BACKUP_INTERVAL_HOURS is set (compose service); runs
# once and exits when invoked directly (make backup).
#
# Required env:
#   POSTGRES_PASSWORD  — superuser password for the silkroadhub DB
# Optional env:
#   POSTGRES_HOST      — default: postgres
#   POSTGRES_USER      — default: srh
#   POSTGRES_DB        — default: silkroadhub
#   BACKUP_DIR         — default: /backups
#   BACKUP_RETENTION_DAYS — default: 7 (older files removed)
#   BACKUP_INTERVAL_HOURS — when set, the script loops with sleep
set -eu

PGHOST=${POSTGRES_HOST:-postgres}
PGUSER=${POSTGRES_USER:-srh}
PGDB=${POSTGRES_DB:-silkroadhub}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION=${BACKUP_RETENTION_DAYS:-7}

mkdir -p "$BACKUP_DIR"

run_once() {
  TS=$(date -u +%Y%m%d-%H%M%S)
  DEST="$BACKUP_DIR/silkroadhub-${TS}.sql.gz"
  echo "[backup] $(date -u +'%Y-%m-%dT%H:%M:%SZ') dumping $PGDB → $DEST"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$PGHOST" -U "$PGUSER" -d "$PGDB" \
    --format=plain --no-owner --no-privileges \
    | gzip -9 > "$DEST"
  SIZE=$(wc -c < "$DEST" 2>/dev/null || echo 0)
  echo "[backup] saved (${SIZE} bytes)"

  # Retention: delete files older than RETENTION days. We use mtime not name
  # because clock skew or manual files shouldn't break rotation.
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'silkroadhub-*.sql.gz' \
    -mtime "+${RETENTION}" -print -delete || true
}

if [ -n "${BACKUP_INTERVAL_HOURS:-}" ]; then
  INTERVAL=$((${BACKUP_INTERVAL_HOURS} * 3600))
  while true; do
    run_once
    echo "[backup] sleeping ${BACKUP_INTERVAL_HOURS}h"
    sleep "$INTERVAL"
  done
else
  run_once
fi
