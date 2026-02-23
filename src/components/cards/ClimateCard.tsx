import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { Slider } from '@/components/controls/Slider';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { setClimateTemperature, setClimateHvacMode } from '@/api/services';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiThermometer, CLIMATE_MODE_ICONS } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

interface ClimateCardProps {
  entityId: string;
}

const CLIMATE_COLOR = '#3B82F6';

export const ClimateCard = memo(function ClimateCard({ entityId }: ClimateCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleTempChange = useCallback(
    (value: number) => {
      if (connection) setClimateTemperature(connection, entityId, value);
    },
    [connection, entityId],
  );

  const handleModeChange = useCallback(
    (mode: string) => {
      if (connection) setClimateHvacMode(connection, entityId, mode);
    },
    [connection, entityId],
  );

  if (!entity) return null;

  const isActive = entity.state !== 'off' && entity.state !== 'unavailable';
  const currentTemp = entity.attributes.current_temperature;
  const targetTemp = entity.attributes.temperature;
  const minTemp = entity.attributes.min_temp || 16;
  const maxTemp = entity.attributes.max_temp || 30;
  const hvacModes: string[] = entity.attributes.hvac_modes || [];
  const name = getEntityName(entity);

  const fillPercent = isActive && targetTemp !== undefined
    ? ((targetTemp - minTemp) / (maxTemp - minTemp)) * 100
    : 0;

  return (
    <GlassCard
      glowColor={isActive ? CLIMATE_COLOR : undefined}
      fillPercent={fillPercent}
      fillColor={CLIMATE_COLOR}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <IconPill
            icon={CLIMATE_MODE_ICONS[entity.state] || mdiThermometer}
            active={isActive}
            color={CLIMATE_COLOR}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-white/50">
              {currentTemp !== null && currentTemp !== undefined
                ? `${Math.round(currentTemp)}°`
                : t('climate.off')}
              {isActive && targetTemp && ` → ${targetTemp}°`}
            </p>
          </div>
        </div>
        <span className="text-xs text-white/40 capitalize shrink-0">{entity.state}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          {isActive && targetTemp !== undefined && (
            <div>
              <p className="text-xs text-white/40 mb-1">{t('climate.targetTemp')}: {targetTemp}°</p>
              <Slider
                value={targetTemp}
                onChange={handleTempChange}
                min={minTemp}
                max={maxTemp}
                color={CLIMATE_COLOR}
              />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {hvacModes.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-touch flex items-center',
                  entity.state === mode
                    ? 'bg-accent-climate/20 text-accent-climate'
                    : 'bg-white/5 text-white/50 hover:bg-white/10',
                )}
              >
                {t(`climate.${mode}`, mode)}
              </button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
});
