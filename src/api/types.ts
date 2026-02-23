export interface AreaRegistryEntry {
  area_id: string;
  name: string;
  picture: string | null;
  icon: string | null;
  floor_id: string | null;
  labels: string[];
  aliases: string[];
}

export interface DeviceRegistryEntry {
  id: string;
  area_id: string | null;
  name: string | null;
  name_by_user: string | null;
  model: string | null;
  manufacturer: string | null;
}

export interface EntityRegistryEntry {
  entity_id: string;
  name: string | null;
  icon: string | null;
  platform: string;
  device_id: string | null;
  area_id: string | null;
  labels: string[];
  hidden_by: string | null;
  disabled_by: string | null;
}
