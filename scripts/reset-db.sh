#!/bin/bash
set -e

# Reset database - choose method via argument
# Usage: ./scripts/reset-db.sh [tables|volume]

METHOD=${1:-tables}

case $METHOD in
  tables)
    echo "Dropping all tables..."
    docker exec bunledge-postgres psql -U bunledge -d bunledge -c "
      DROP TABLE IF EXISTS assessment CASCADE;
      DROP TABLE IF EXISTS \"user\" CASCADE;
      DROP TABLE IF EXISTS exercise CASCADE;
    "
    echo "Tables dropped. Restart backend to recreate them."
    ;;
  volume)
    echo "Removing container and volume..."
    docker compose down -v
    echo "Starting fresh PostgreSQL..."
    docker compose up -d
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
    echo "Done. Restart backend to create tables."
    ;;
  *)
    echo "Usage: $0 [tables|volume]"
    echo "  tables - Drop all tables (faster, keeps container running)"
    echo "  volume - Remove container and volume (full reset)"
    exit 1
    ;;
esac
