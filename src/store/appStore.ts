import { create } from 'zustand';
import type { ViewId } from '@/types/navigation';

interface AppStore {
  activeView: ViewId;
  selectedAreaId: string | null;

  setActiveView: (view: ViewId) => void;
  navigateToArea: (areaId: string) => void;
  navigateBack: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeView: 'home',
  selectedAreaId: null,

  setActiveView: (view) => set({ activeView: view, selectedAreaId: null }),
  navigateToArea: (areaId) => set({ selectedAreaId: areaId }),
  navigateBack: () => set({ selectedAreaId: null }),
}));
