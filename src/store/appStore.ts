import { create } from 'zustand';
import type { ViewId } from '@/types/navigation';

interface AppStore {
  activeView: ViewId;
  selectedAreaId: string | null;
  editMode: boolean;
  editingEntityId: string | null;
  editingAreaId: string | null;

  setActiveView: (view: ViewId) => void;
  navigateToArea: (areaId: string) => void;
  navigateBack: () => void;
  toggleEditMode: () => void;
  setEditingEntity: (entityId: string | null) => void;
  setEditingArea: (areaId: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeView: 'home',
  selectedAreaId: null,
  editMode: false,
  editingEntityId: null,
  editingAreaId: null,

  setActiveView: (view) => set({ activeView: view, selectedAreaId: null }),
  navigateToArea: (areaId) => set({ selectedAreaId: areaId }),
  navigateBack: () => set({ selectedAreaId: null }),
  toggleEditMode: () =>
    set((s) => ({ editMode: !s.editMode, editingEntityId: null, editingAreaId: null })),
  setEditingEntity: (entityId) => set({ editingEntityId: entityId }),
  setEditingArea: (areaId) => set({ editingAreaId: areaId }),
}));
