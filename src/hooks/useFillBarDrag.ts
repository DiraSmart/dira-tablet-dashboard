import { useCallback, useRef } from 'react';

interface UseFillBarDragOptions {
  onTap?: () => void;
  onChange?: (percent: number) => void;
  disabled?: boolean;
}

const TAP_TIME_THRESHOLD = 250; // ms
const TAP_DISTANCE_THRESHOLD = 10; // px

export function useFillBarDrag({ onTap, onChange, disabled }: UseFillBarDragOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startTime = useRef(0);
  const hasMoved = useRef(false);

  const getPercent = useCallback((clientX: number): number => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      isDragging.current = true;
      hasMoved.current = false;
      startX.current = e.clientX;
      startTime.current = Date.now();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || disabled) return;
      const dx = Math.abs(e.clientX - startX.current);
      if (dx > TAP_DISTANCE_THRESHOLD) {
        hasMoved.current = true;
      }
      if (hasMoved.current && onChange) {
        onChange(Math.round(getPercent(e.clientX)));
      }
    },
    [disabled, onChange, getPercent],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const elapsed = Date.now() - startTime.current;
      const dx = Math.abs(e.clientX - startX.current);

      if (!hasMoved.current && elapsed < TAP_TIME_THRESHOLD && dx < TAP_DISTANCE_THRESHOLD) {
        onTap?.();
      } else if (hasMoved.current && onChange) {
        onChange(Math.round(getPercent(e.clientX)));
      }
    },
    [onTap, onChange, getPercent],
  );

  return {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
  };
}
