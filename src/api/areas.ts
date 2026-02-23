import type { Connection } from 'home-assistant-js-websocket';
import type { AreaRegistryEntry, DeviceRegistryEntry, EntityRegistryEntry } from './types';

export async function fetchAreas(conn: Connection): Promise<AreaRegistryEntry[]> {
  return conn.sendMessagePromise({ type: 'config/area_registry/list' });
}

export async function fetchDevices(conn: Connection): Promise<DeviceRegistryEntry[]> {
  return conn.sendMessagePromise({ type: 'config/device_registry/list' });
}

export async function fetchEntityRegistry(conn: Connection): Promise<EntityRegistryEntry[]> {
  return conn.sendMessagePromise({ type: 'config/entity_registry/list' });
}

export function buildAreaEntityMap(
  entities: EntityRegistryEntry[],
  devices: DeviceRegistryEntry[],
): Map<string, string[]> {
  const deviceAreaMap = new Map<string, string>();
  for (const device of devices) {
    if (device.area_id) {
      deviceAreaMap.set(device.id, device.area_id);
    }
  }

  const areaEntityMap = new Map<string, string[]>();
  for (const entity of entities) {
    const areaId =
      entity.area_id || (entity.device_id ? deviceAreaMap.get(entity.device_id) : undefined);
    if (areaId && !entity.disabled_by && !entity.hidden_by) {
      const list = areaEntityMap.get(areaId) || [];
      list.push(entity.entity_id);
      areaEntityMap.set(areaId, list);
    }
  }

  return areaEntityMap;
}
