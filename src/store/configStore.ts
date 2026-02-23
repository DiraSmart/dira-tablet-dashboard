import { create } from 'zustand';
import type { DashboardConfig, AreaConfig } from '@/types/config';

interface ConfigStore {
  config: DashboardConfig | null;
  loading: boolean;
  error: string | null;

  fetchConfig: () => Promise<void>;
  saveConfig: (config: DashboardConfig) => Promise<void>;
  setConfig: (config: DashboardConfig) => void;
  updateArea: (areaId: string, updates: Partial<AreaConfig>) => void;
  reorderAreas: (orderedIds: string[]) => void;
  toggleAreaVisibility: (areaId: string) => void;
  clearConfig: () => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('./api/config');
      if (res.status === 404) {
        set({ config: null, loading: false });
        return;
      }
      const config = await res.json();
      set({ config, loading: false });
    } catch {
      set({ error: 'Failed to load config', loading: false });
    }
  },

  saveConfig: async (config) => {
    try {
      await fetch('./api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      set({ config });
    } catch {
      set({ error: 'Failed to save config' });
    }
  },

  setConfig: (config) => set({ config }),

  updateArea: (areaId, updates) => {
    const config = get().config;
    if (!config) return;
    const newConfig = {
      ...config,
      areas: config.areas.map((a) => (a.areaId === areaId ? { ...a, ...updates } : a)),
    };
    set({ config: newConfig });
    get().saveConfig(newConfig);
  },

  reorderAreas: (orderedIds) => {
    const config = get().config;
    if (!config) return;
    const newAreas = orderedIds.map((id, index) => {
      const area = config.areas.find((a) => a.areaId === id)!;
      return { ...area, order: index };
    });
    const newConfig = { ...config, areas: newAreas };
    set({ config: newConfig });
    get().saveConfig(newConfig);
  },

  toggleAreaVisibility: (areaId) => {
    const config = get().config;
    if (!config) return;
    const newConfig = {
      ...config,
      areas: config.areas.map((a) =>
        a.areaId === areaId ? { ...a, visible: !a.visible } : a,
      ),
    };
    set({ config: newConfig });
    get().saveConfig(newConfig);
  },

  clearConfig: () => set({ config: null }),
}));
