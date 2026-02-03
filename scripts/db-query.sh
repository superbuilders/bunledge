#!/bin/bash
# Run a SQL query against the database
# Usage: ./scripts/db-query.sh "SELECT * FROM user"

if [ -z "$1" ]; then
  echo "Usage: $0 \"SQL QUERY\""
  echo "Example: $0 \"SELECT * FROM \\\"user\\\"\""
  exit 1
fi

docker exec bunledge-postgres psql -U bunledge -d bunledge -c "$1"
