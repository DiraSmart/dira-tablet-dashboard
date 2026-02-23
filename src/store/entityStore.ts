import { create } from 'zustand';
import {
  subscribeEntities,
  type HassEntities,
  type HassEntity,
  type Connection,
} from 'home-assistant-js-websocket';

interface EntityStore {
  entities: HassEntities;
  subscribe: (conn: Connection) => () => void;
}

export const useEntityStore = create<EntityStore>((set) => ({
  entities: {},

  subscribe: (conn: Connection) => {
    const unsub = subscribeEntities(conn, (newEntities) => {
      set({ entities: newEntities });
    });
    return unsub;
  },
}));

// Selective hook: only re-renders when THIS specific entity changes
export function useEntity(entityId: string): HassEntity | undefined {
  return useEntityStore((state) => state.entities[entityId]);
}

// All entities of a domain - uses shallow comparison
export function useEntitiesByDomain(domain: string): HassEntity[] {
  return useEntityStore((state) => {
    const prefix = domain + '.';
    return Object.values(state.entities).filter((e) => e.entity_id.startsWith(prefix));
  });
}

// Multiple entities by IDs
export function useEntitiesByIds(entityIds: string[]): HassEntity[] {
  return useEntityStore((state) =>
    entityIds.map((id) => state.entities[id]).filter(Boolean) as HassEntity[],
  );
}

// Count entities in a domain that are in a specific state
export function useEntityCount(domain: string, stateFilter?: string): number {
  return useEntityStore((state) => {
    const prefix = domain + '.';
    return Object.values(state.entities).filter(
      (e) => e.entity_id.startsWith(prefix) && (!stateFilter || e.state === stateFilter),
    ).length;
  });
}
