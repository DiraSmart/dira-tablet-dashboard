#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Dira Dashboard..."
bashio::log.info "Port: ${PORT}"

# Read access token from add-on config (set by user in HA UI)
ACCESS_TOKEN=$(bashio::config 'access_token' 2>/dev/null || echo "")
export HA_ACCESS_TOKEN="${ACCESS_TOKEN}"

if [ -n "${ACCESS_TOKEN}" ]; then
  bashio::log.info "Access token: configured"
else
  bashio::log.warning "No access token configured! Go to add-on Configuration tab and add a long-lived access token."
fi

exec node /app/dist/server/index.js
