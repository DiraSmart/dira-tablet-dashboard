import { useRef, useState, useEffect } from 'react';
import { useEntity } from '@/store/entityStore';
import type { HassEntity } from 'home-assistant-js-websocket';

export function useDebouncedEntity(
  entityId: string,
  intervalMs: number = 2000,
): HassEntity | undefined {
  const entity = useEntity(entityId);
  const [debouncedEntity, setDebouncedEntity] = useState(entity);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!entity) return;

    const now = Date.now();
    if (now - lastUpdateRef.current >= intervalMs) {
      setDebouncedEntity(entity);
      lastUpdateRef.current = now;
    } else {
      const timer = setTimeout(() => {
        setDebouncedEntity(entity);
        lastUpdateRef.current = Date.now();
      }, intervalMs - (now - lastUpdateRef.current));
      return () => clearTimeout(timer);
    }
  }, [entity, intervalMs]);

  return debouncedEntity;
}
