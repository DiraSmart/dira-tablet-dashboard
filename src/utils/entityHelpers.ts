import type { HassEntity } from 'home-assistant-js-websocket';

export function getDomain(entityId: string): string {
  return entityId.split('.')[0];
}

export function getEntityName(entity: HassEntity): string {
  return entity.attributes.friendly_name || entity.entity_id;
}

export function isEntityOn(entity: HassEntity): boolean {
  return entity.state === 'on';
}

export function isEntityAvailable(entity: HassEntity): boolean {
  return entity.state !== 'unavailable' && entity.state !== 'unknown';
}

export function getBrightness(entity: HassEntity): number | null {
  const b = entity.attributes.brightness;
  if (b === undefined || b === null) return null;
  return Math.round((b / 255) * 100);
}

export function getTemperature(entity: HassEntity): string {
  const temp = entity.attributes.current_temperature;
  const unit = entity.attributes.temperature_unit || '°C';
  if (temp === undefined || temp === null) return '--';
  return `${Math.round(temp)}${unit}`;
}

export function getCoverPosition(entity: HassEntity): number | null {
  const pos = entity.attributes.current_position;
  if (pos === undefined || pos === null) return null;
  return pos;
}

export function formatEntityState(entity: HassEntity): string {
  const domain = getDomain(entity.entity_id);
  const state = entity.state;

  if (state === 'unavailable') return 'N/A';
  if (state === 'unknown') return '?';

  switch (domain) {
    case 'light':
      if (state === 'on') {
        const brightness = getBrightness(entity);
        return brightness !== null ? `${brightness}%` : 'On';
      }
      return 'Off';

    case 'climate': {
      const temp = entity.attributes.current_temperature;
      if (temp !== null && temp !== undefined) {
        return `${Math.round(temp)}°`;
      }
      return state;
    }

    case 'cover':
      return state.charAt(0).toUpperCase() + state.slice(1);

    case 'lock':
      return state === 'locked' ? 'Locked' : 'Unlocked';

    case 'sensor':
    case 'binary_sensor': {
      const unit = entity.attributes.unit_of_measurement;
      return unit ? `${state} ${unit}` : state;
    }

    default:
      return state;
  }
}

export const DOMAIN_ACCENT_COLORS: Record<string, string> = {
  light: '#F59E0B',
  climate: '#3B82F6',
  cover: '#8B5CF6',
  camera: '#EC4899',
  lock: '#10B981',
  alarm_control_panel: '#10B981',
  sensor: '#6B7280',
  binary_sensor: '#6B7280',
  switch: '#F59E0B',
};
