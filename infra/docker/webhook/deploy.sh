#!/bin/sh
set -e

VERSION="${1:-latest}"
COMPOSE="docker compose -f /opt/shop/docker-compose.yml"

echo "[deploy] Version: $VERSION"

# Neues Image ziehen
VERSION=$VERSION $COMPOSE pull app

# App mit neuem Image starten (Migrations laufen automatisch im Entrypoint)
VERSION=$VERSION $COMPOSE up -d --no-deps app

# Auf healthy warten (max 60s)
echo "[deploy] Warte auf Health-Check..."
i=0
until $COMPOSE ps app | grep -q "healthy" || [ $i -ge 12 ]; do
  sleep 5
  i=$((i + 1))
done

if $COMPOSE ps app | grep -q "healthy"; then
  echo "[deploy] Erfolgreich deployed: $VERSION"
else
  echo "[deploy] Health-Check fehlgeschlagen nach 60s" >&2
  exit 1
fi
