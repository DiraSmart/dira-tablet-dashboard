import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { useEntityStore } from '@/store/entityStore';
import { DOMAIN_ICONS, mdiHomeFloor1 } from '@/utils/iconMap';
import type { AreaConfig } from '@/types/config';

interface AreaCardProps {
  areaConfig: AreaConfig;
  onClick: () => void;
}

export const AreaCard = memo(function AreaCard({ areaConfig, onClick }: AreaCardProps) {
  const { t } = useTranslation();
  const entities = useEntityStore((s) => s.entities);

  const stats = useMemo(() => {
    const areaEntities = areaConfig.entityIds
      .map((id) => entities[id])
      .filter(Boolean);

    const lightsOn = areaEntities.filter(
      (e) => e.entity_id.startsWith('light.') && e.state === 'on',
    ).length;
    const lightsTotal = areaEntities.filter((e) => e.entity_id.startsWith('light.')).length;

    const climate = areaEntities.find((e) => e.entity_id.startsWith('climate.'));
    const currentTemp =
      climate?.attributes.current_temperature !== undefined && climate?.attributes.current_temperature !== null
        ? `${Math.round(climate.attributes.current_temperature)}°`
        : null;

    const sensorsTotal = areaEntities.filter(
      (e) => e.entity_id.startsWith('sensor.') || e.entity_id.startsWith('binary_sensor.'),
    ).length;

    return { lightsOn, lightsTotal, currentTemp, sensorsTotal };
  }, [areaConfig.entityIds, entities]);

  const hasActiveLights = stats.lightsOn > 0;

  return (
    <GlassCard onClick={onClick} glowColor={hasActiveLights ? '#F59E0B' : undefined}>
      <div className="flex items-center gap-3">
        <IconPill
          icon={DOMAIN_ICONS[areaConfig.icon] || mdiHomeFloor1}
          active={hasActiveLights}
          color="#F59E0B"
          size={24}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">{areaConfig.displayName}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {stats.lightsTotal > 0 && (
              <span className="text-xs text-white/50">
                {stats.lightsOn > 0
                  ? t('home.lightsOn', { count: stats.lightsOn })
                  : t('lights.allOff')}
              </span>
            )}
            {stats.currentTemp && (
              <span className="text-xs text-accent-climate">{stats.currentTemp}</span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
});
