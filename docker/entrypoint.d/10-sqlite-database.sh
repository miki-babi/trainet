#!/bin/sh
# Create the SQLite database file before the Laravel automations (50-*) run
# migrations. Runs as root during container start.
set -e

if [ "${DB_CONNECTION:-sqlite}" != "sqlite" ] || [ "${DB_DATABASE}" = ":memory:" ]; then
    exit 0
fi

DB_FILE="${DB_DATABASE:-database/database.sqlite}"
case "$DB_FILE" in
    /*) ;;
    *) DB_FILE="${APP_BASE_DIR:-/var/www/html}/$DB_FILE" ;;
esac

if [ ! -f "$DB_FILE" ]; then
    mkdir -p "$(dirname "$DB_FILE")"
    touch "$DB_FILE"
    chown www-data:www-data "$DB_FILE"
    echo "Created SQLite database at $DB_FILE"
fi
