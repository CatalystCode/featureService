#!/usr/bin/env bash

set -e

run_sql() {
  PGSSLMODE="require" \
  PGPASSWORD="${FEATURES_DB_PASSWORD}" \
  psql \
    --tuples-only \
    --username="${FEATURES_DB_USER}" \
    --port="${FEATURES_DB_PORT}" \
    --host="${FEATURES_DB_HOST}" \
    --dbname="$1"
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

can_connect_to_database() {
  echo "SELECT version();" \
  | run_sql 'postgres'
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

while ! can_connect_to_database; do
  log "Unable to connect to database, retrying."
  sleep 30s
done

username="${FEATURES_DB_USER%@*}"
hostname="${FEATURES_DB_USER#*@}"

if ! features_database_exists; then
  dump_file="/tmp/db.fc.gz"

  log "Setting up database..."
  echo "CREATE DATABASE ${FEATURES_DB_NAME};" | run_sql 'postgres'
  echo "CREATE USER ops WITH login password 'changeme';" | run_sql 'postgres'
  echo "CREATE USER frontend WITH login password 'changeme';" | run_sql 'postgres'
  echo "ALTER USER ops WITH password '${FEATURES_DB_PASSWORD}';" | run_sql 'postgres'
  echo "ALTER USER frontend WITH password '${FEATURES_DB_PASSWORD}';" | run_sql 'postgres'
  echo "GRANT ops TO ${username};" | run_sql 'postgres'
  echo "GRANT frontend TO ${username};" | run_sql 'postgres'
  log "...done, database is now set up"

  log "Setting up schema..."
  < /app/ddl/schema.sql run_sql "${FEATURES_DB_NAME}"
  log "...done, schema is now set up"

  retries=0
  max_retries=5
  db_is_setup=0
  while [ "${retries}" -lt "${max_retries}" ]; do
    log "Fetching database dump..."
    curl --silent "${FEATURES_DB_DUMP_URL}" > "${dump_file}"
    log "...done, database dump is now available"

    log "Ingesting database dump..."
    if load_features_dump "${dump_file}"; then
      log "...done, database dump is now ingested"
      db_is_setup=1
      break
    else
      retries="$((retries + 1))"
      log "...error ingesting database dump, retrying"
    fi
  done
  if [ "${db_is_setup}" -ne 1 ]; then fail "Unable to setup database in ${max_retries} retries"; fi
  rm "${dump_file}"

  log "Setting up indices..."
  < /app/ddl/indices.sql run_sql "${FEATURES_DB_NAME}"
  log "...done, indices are now set up"

  log "Improving query planner..."
  echo "ANALYZE;" | run_sql "${FEATURES_DB_NAME}"
  log "...done, query planner is now ready"
fi

export FEATURES_CONNECTION_STRING="postgres://frontend@${hostname}:${FEATURES_DB_PASSWORD}@${FEATURES_DB_HOST}:${FEATURES_DB_PORT}/${FEATURES_DB_NAME}?ssl=true"

while ! npm start; do
  sleep 30s
done
