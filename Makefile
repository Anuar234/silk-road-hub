# Railway deploy helpers.
# Prereqs:
#   npm i -g @railway/cli
#   make login
#   make link   (pick the project, then link twice — once per service)
#
# Service names below must match what you created in the Railway UI.

FRONTEND_SVC ?= frontend
BACKEND_SVC  ?= backend

.PHONY: help login link status deploy deploy-frontend deploy-backend \
        logs-frontend logs-backend vars-frontend vars-backend \
        gen-secret open \
        backup backup-list restore

help:
	@echo "Railway:"
	@echo "  login             Authenticate the Railway CLI"
	@echo "  link              Link this repo to an existing Railway project"
	@echo "  status            Show currently linked project + service"
	@echo "  deploy            Deploy backend then frontend"
	@echo "  deploy-backend    Upload ./backend and deploy the Go service"
	@echo "  deploy-frontend   Upload repo root and deploy the Next.js service"
	@echo "  logs-backend      Tail logs of $(BACKEND_SVC)"
	@echo "  logs-frontend     Tail logs of $(FRONTEND_SVC)"
	@echo "  vars-backend      Print env vars of $(BACKEND_SVC)"
	@echo "  vars-frontend     Print env vars of $(FRONTEND_SVC)"
	@echo "  gen-secret        Print a random 48-byte base64 secret (for SRH_SESSION_SECRET)"
	@echo "  open              Open the Railway project in a browser"
	@echo
	@echo "Backups (docker-compose):"
	@echo "  backup            One-off pg_dump into the backup_data volume"
	@echo "  backup-list       List archives currently stored in the volume"
	@echo "  restore FILE=...  Restore from an archive (e.g. FILE=/backups/silkroadhub-...sql.gz)"

login:
	railway login

link:
	railway link

status:
	railway status

deploy: deploy-backend deploy-frontend

deploy-backend:
	cd backend && railway up --service $(BACKEND_SVC) --detach

deploy-frontend:
	railway up --service $(FRONTEND_SVC) --detach

logs-backend:
	railway logs --service $(BACKEND_SVC)

logs-frontend:
	railway logs --service $(FRONTEND_SVC)

vars-backend:
	railway variables --service $(BACKEND_SVC)

vars-frontend:
	railway variables --service $(FRONTEND_SVC)

gen-secret:
	@node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

open:
	railway open

# --- Backup operations ---
# Each target invokes the long-running `backup` service via `docker compose run`
# with a one-shot override (no entrypoint loop, no detached lifetime). Files
# land in the backup_data volume mounted at /backups inside the container.

backup:
	docker compose run --rm --no-deps -e BACKUP_INTERVAL_HOURS= backup /bin/sh /scripts/backup.sh

backup-list:
	docker compose run --rm --no-deps -e BACKUP_INTERVAL_HOURS= backup ls -lht /backups

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore FILE=/backups/silkroadhub-YYYYMMDD-HHMMSS.sql.gz [CONFIRM=1]"; \
		echo; \
		$(MAKE) backup-list; \
		exit 1; \
	fi
	docker compose run --rm --no-deps -e BACKUP_INTERVAL_HOURS= backup /bin/sh /scripts/restore.sh $(FILE) $(if $(CONFIRM),--confirm,)
