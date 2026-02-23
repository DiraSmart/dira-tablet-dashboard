import { callService, type Connection } from 'home-assistant-js-websocket';

export function toggleLight(conn: Connection, entityId: string) {
  return callService(conn, 'light', 'toggle', {}, { entity_id: entityId });
}

export function turnOnLight(conn: Connection, entityId: string, brightness?: number) {
  const data = brightness !== undefined ? { brightness } : {};
  return callService(conn, 'light', 'turn_on', data, { entity_id: entityId });
}

export function turnOffLight(conn: Connection, entityId: string) {
  return callService(conn, 'light', 'turn_off', {}, { entity_id: entityId });
}

export function setClimateTemperature(conn: Connection, entityId: string, temperature: number) {
  return callService(conn, 'climate', 'set_temperature', { temperature }, { entity_id: entityId });
}

export function setClimateHvacMode(conn: Connection, entityId: string, hvacMode: string) {
  return callService(conn, 'climate', 'set_hvac_mode', { hvac_mode: hvacMode }, { entity_id: entityId });
}

export function setCoverPosition(conn: Connection, entityId: string, position: number) {
  return callService(conn, 'cover', 'set_cover_position', { position }, { entity_id: entityId });
}

export function openCover(conn: Connection, entityId: string) {
  return callService(conn, 'cover', 'open_cover', {}, { entity_id: entityId });
}

export function closeCover(conn: Connection, entityId: string) {
  return callService(conn, 'cover', 'close_cover', {}, { entity_id: entityId });
}

export function stopCover(conn: Connection, entityId: string) {
  return callService(conn, 'cover', 'stop_cover', {}, { entity_id: entityId });
}

export function lockEntity(conn: Connection, entityId: string) {
  return callService(conn, 'lock', 'lock', {}, { entity_id: entityId });
}

export function unlockEntity(conn: Connection, entityId: string) {
  return callService(conn, 'lock', 'unlock', {}, { entity_id: entityId });
}
