import { memo, useCallback, useRef } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

export const Slider = memo(function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  color = '#3B82F6',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = Math.round(min + percent * (max - min));
      onChange(newValue);
    },
    [min, max, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateValue(e.clientX);
    },
    [updateValue],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updateValue(e.clientX);
    },
    [updateValue],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className="relative h-10 flex items-center cursor-pointer touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-x-0 h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-75"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <div
        className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg -translate-x-1/2 pointer-events-none"
        style={{ left: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
});
