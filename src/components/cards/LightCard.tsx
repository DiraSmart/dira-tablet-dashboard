import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { useFillBarDrag } from '@/hooks/useFillBarDrag';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { toggleLight, turnOnLight } from '@/api/services';
import { getEntityName, getBrightness } from '@/utils/entityHelpers';
import { getEntityIcon } from '@/utils/iconMap';

interface LightCardProps {
  entityId: string;
}

const LIGHT_COLOR = '#F59E0B';

export const LightCard = memo(function LightCard({ entityId }: LightCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    if (connection) toggleLight(connection, entityId);
  }, [connection, entityId]);

  const handleBrightness = useCallback(
    (percent: number) => {
      if (connection) {
        const clamped = Math.max(1, Math.min(100, percent));
        turnOnLight(connection, entityId, Math.round((clamped / 100) * 255));
      }
    },
    [connection, entityId],
  );

  const { containerRef, handlePointerDown, handlePointerMove, handlePointerUp, isDragging } =
    useFillBarDrag({
      onTap: handleToggle,
      onChange: handleBrightness,
    });

  if (!entity) return null;

  const isOn = entity.state === 'on';
  const brightness = getBrightness(entity);
  const fillPercent = isOn ? (brightness !== null ? brightness : 100) : 0;
  const name = getEntityName(entity);
  const icon = getEntityIcon(entity);

  return (
    <GlassCard
      ref={containerRef}
      glowColor={isOn ? LIGHT_COLOR : undefined}
      fillPercent={fillPercent}
      fillColor={LIGHT_COLOR}
      noTransition={isDragging.current}
    >
      <div
        className="flex items-center gap-3 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <IconPill icon={icon} active={isOn} color={LIGHT_COLOR} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-white/50">
            {isOn ? (brightness !== null ? `${brightness}%` : t('lights.on')) : t('lights.off')}
          </p>
        </div>
      </div>
    </GlassCard>
  );
});
