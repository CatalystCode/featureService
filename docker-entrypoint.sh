#!/usr/bin/env bash

run_sql() {
  PGSSLMODE="require" \
  PGPASSWORD="${FEATURES_DB_PASSWORD}" \
  psql \
    --username="${FEATURES_DB_USER}" \
    --port="${FEATURES_DB_PORT}" \
    --host="${FEATURES_DB_HOST}" \
    --dbname="$1" \
}

load_features_dump() {
  PGSSLMODE="require" \
  PGPASSWORD="${FEATURES_DB_PASSWORD}" \
  pg_restore \
    --username="${FEATURES_DB_USER}" \
    --port="${FEATURES_DB_PORT}" \
    --host="${FEATURES_DB_HOST}" \
    --dbname="${FEATURES_DB_NAME}" \
    --jobs="$(grep -c ^processor /proc/cpuinfo)" \
    "$1"
}

features_database_exists() {
  echo "SELECT 'yes' FROM pg_database WHERE datname='${FEATURES_DB_NAME}';" \
  | run_sql 'postgres' \
  | grep -q 'yes'
}

log() {
  echo "[$(date)] $1"
}

fail() {
  echo "$1" >&2
  exit 1
}

if [ -z "${FEATURES_DB_USER}" ]; then fail "Need to provide FEATURES_DB_USER environment variable"; fi
if [ -z "${FEATURES_DB_PASSWORD}" ]; then fail "Need to provide FEATURES_DB_PASSWORD environment variable"; fi
if [ -z "${FEATURES_DB_HOST}" ]; then fail "Need to provide FEATURES_DB_HOST environment variable"; fi

if ! features_database_exists; then
  dump_file="/tmp/db.fc.gz"

  log "Setting up database..."
  echo "CREATE DATABASE ${FEATURES_DB_NAME};" | run_sql 'postgres'
  echo "CREATE USER ops WITH login password 'changeme';" | run_sql 'postgres'
  echo "CREATE USER frontend WITH login password 'changeme';" | run_sql 'postgres'
  echo "ALTER USER ops WITH password '${FEATURES_DB_PASSWORD}';" | run_sql 'postgres'
  echo "ALTER USER frontend WITH password '${FEATURES_DB_PASSWORD}';" | run_sql 'postgres'
  echo "GRANT ops TO ${FEATURES_DB_USER%@*};" | run_sql 'postgres'
  echo "GRANT frontend TO ${FEATURES_DB_USER%@*};" | run_sql 'postgres'
  log "...done, database is now set up"

  log "Setting up schema..."
  < /app/ddl/schema.sql run_sql "${FEATURES_DB_NAME}"
  log "...done, schema is now set up"

  log "Fetching database dump..."
  curl --silent "${FEATURES_DB_DUMP_URL}" > "${dump_file}"
  log "...done, database dump is now available"

  log "Ingesting database dump..."
  load_features_dump "${dump_file}"
  rm "${dump_file}"
  log "...done, database dump is now ingested"

  log "Setting up indices..."
  < /app/ddl/indices.sql run_sql "${FEATURES_DB_NAME}"
  log "...done, indices are now set up"

  log "Improving query planner..."
  echo "ANALYZE;" | run_sql "${FEATURES_DB_NAME}"
  log "...done, query planner is now ready"
fi

FEATURES_CONNECTION_STRING="postgres://frontend:${FEATURES_DB_PASSWORD}@${FEATURES_DB_HOST}:${FEATURES_DB_PORT}/${FEATURES_DB_NAME}?ssl=true" \
npm start
