#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Dira Dashboard..."
bashio::log.info "Port: ${PORT}"
bashio::log.info "Supervisor token present: $(if [ -n "${SUPERVISOR_TOKEN}" ]; then echo 'yes'; else echo 'NO'; fi)"

exec node /app/dist/server/index.js
