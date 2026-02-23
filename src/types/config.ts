export interface DashboardConfig {
  version: number;
  hassUrl: string;
  hassToken: string;
  areas: AreaConfig[];
  globalEntityOverrides: Record<string, EntityOverride>;
  sidebar: SidebarConfig;
  theme: ThemeConfig;
  performance: PerformanceConfig;
}

export interface AreaConfig {
  areaId: string;
  displayName: string;
  icon: string;
  order: number;
  visible: boolean;
  entityIds: string[];
  entityOverrides: Record<string, EntityOverride>;
}

export interface EntityOverride {
  displayName?: string;
  icon?: string;
  visible?: boolean;
  order?: number;
  labels?: string[];
}

export interface SidebarConfig {
  items: SidebarItemConfig[];
  showConnectionStatus: boolean;
  showClock: boolean;
}

export interface SidebarItemConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

export interface ThemeConfig {
  mode: 'dark' | 'light' | 'auto';
  accentColor: string;
  reducedMotion: boolean;
}

export interface PerformanceConfig {
  sensorDebounceMs: number;
  enableCameraStreams: boolean;
  maxVisibleEntities: number;
  enableBackdropBlur: boolean;
}
