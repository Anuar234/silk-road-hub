#!/bin/sh
# Restore the silkroadhub DB from a gzipped pg_dump archive.
#
# Usage (inside the backup container):
#   docker compose exec backup /scripts/restore.sh /backups/silkroadhub-YYYYMMDD-HHMMSS.sql.gz
#
# Pass --confirm to skip the interactive prompt (useful in CI). Without it the
# script asks before dropping data.
set -eu

PGHOST=${POSTGRES_HOST:-postgres}
PGUSER=${POSTGRES_USER:-srh}
PGDB=${POSTGRES_DB:-silkroadhub}
BACKUP_DIR=${BACKUP_DIR:-/backups}

usage() {
  echo "Usage: $0 <backup-file> [--confirm]"
  echo
  echo "Available backups in $BACKUP_DIR:"
  ls -1t "$BACKUP_DIR"/silkroadhub-*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
}

[ $# -ge 1 ] || usage

FILE=$1
CONFIRM=${2:-}

[ -f "$FILE" ] || { echo "[restore] file not found: $FILE"; exit 2; }

if [ "$CONFIRM" != "--confirm" ]; then
  printf '[restore] this will OVERWRITE database "%s" on host "%s". Type yes to continue: ' "$PGDB" "$PGHOST"
  read ans
  [ "$ans" = "yes" ] || { echo "[restore] aborted"; exit 3; }
fi

echo "[restore] restoring from $FILE"
gunzip -c "$FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1
echo "[restore] done"
