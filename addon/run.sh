#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Dira Dashboard..."
bashio::log.info "Port: ${PORT}"

# Read options if set
if bashio::config.has_value 'HASS_URL'; then
  export HASS_URL=$(bashio::config 'HASS_URL')
fi

if bashio::config.has_value 'HASS_TOKEN'; then
  export HASS_TOKEN=$(bashio::config 'HASS_TOKEN')
fi

exec node /app/dist/server/index.js
