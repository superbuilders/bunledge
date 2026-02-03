#!/bin/bash
# Open a psql shell to the database
# Usage: ./scripts/db-shell.sh

docker exec -it bunledge-postgres psql -U bunledge -d bunledge
