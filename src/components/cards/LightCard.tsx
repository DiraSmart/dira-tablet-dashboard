import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { Slider } from '@/components/controls/Slider';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { toggleLight, turnOnLight } from '@/api/services';
import { getEntityName, getBrightness } from '@/utils/entityHelpers';
import { mdiLightbulb } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

interface LightCardProps {
  entityId: string;
}

export const LightCard = memo(function LightCard({ entityId }: LightCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    if (connection) toggleLight(connection, entityId);
  }, [connection, entityId]);

  const handleBrightness = useCallback(
    (value: number) => {
      if (connection) turnOnLight(connection, entityId, Math.round((value / 100) * 255));
    },
    [connection, entityId],
  );

  if (!entity) return null;

  const isOn = entity.state === 'on';
  const brightness = getBrightness(entity);
  const name = getEntityName(entity);

  return (
    <GlassCard glowColor={isOn ? '#F59E0B' : undefined}>
      <div className="flex items-center justify-between" onClick={handleToggle}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isOn ? 'bg-accent-light/20 text-accent-light' : 'bg-white/5 text-white/30',
            )}
          >
            <Icon path={mdiLightbulb} size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-white/50">
              {isOn ? (brightness !== null ? `${brightness}%` : t('lights.on')) : t('lights.off')}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'w-10 h-6 rounded-full transition-colors duration-200 flex items-center shrink-0',
            isOn ? 'bg-accent-light justify-end' : 'bg-white/10 justify-start',
          )}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5" />
        </div>
      </div>

      {isOn && brightness !== null && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <Slider value={brightness} onChange={handleBrightness} color="#F59E0B" />
        </div>
      )}
    </GlassCard>
  );
});
