#!/bin/bash
set -e

# Reset database - choose method via argument
# Usage: ./scripts/reset-db.sh [tables|volume]

METHOD=${1:-tables}

# Ensure PostgreSQL is running
ensure_postgres() {
  if ! docker ps --format '{{.Names}}' | grep -q bunledge-postgres; then
    echo "Starting PostgreSQL..."
    docker compose up -d
    sleep 2
  fi
}

case $METHOD in
  tables)
    ensure_postgres
    echo "Dropping all tables..."
    docker exec bunledge-postgres psql -U bunledge -d bunledge -c "
      DROP TABLE IF EXISTS activityprogress CASCADE;
      DROP TABLE IF EXISTS activity CASCADE;
      DROP TABLE IF EXISTS \"user\" CASCADE;
    "
    echo "Recreating tables..."
    cd backend
    uv run python -m scripts.init_db
    cd ..
    ;;
  volume)
    echo "Removing container and volume..."
    docker compose down -v
    echo "Starting fresh PostgreSQL..."
    docker compose up -d
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
    echo "Recreating tables..."
    cd backend
    uv run python -m scripts.init_db
    cd ..
    ;;
  *)
    echo "Usage: $0 [tables|volume]"
    echo "  tables - Drop all tables (faster, keeps container running)"
    echo "  volume - Remove container and volume (full reset)"
    exit 1
    ;;
esac
