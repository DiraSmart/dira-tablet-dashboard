import { memo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { useDebouncedEntity } from '@/hooks/useDebouncedEntity';
import { getEntityName, getDomain, DOMAIN_ACCENT_COLORS } from '@/utils/entityHelpers';
import { getEntityIcon } from '@/utils/iconMap';

interface SensorCardProps {
  entityId: string;
}

export const SensorCard = memo(function SensorCard({ entityId }: SensorCardProps) {
  const entity = useDebouncedEntity(entityId);

  if (!entity) return null;

  const name = getEntityName(entity);
  const unit = entity.attributes.unit_of_measurement || '';
  const value = entity.state;
  const displayValue = value === 'unavailable' ? 'N/A' : value === 'unknown' ? '?' : value;
  const icon = getEntityIcon(entity);
  const domain = getDomain(entity.entity_id);
  const isOn = domain === 'binary_sensor' ? entity.state === 'on' : true;
  const color = DOMAIN_ACCENT_COLORS[domain] || '#6B7280';

  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <IconPill icon={icon} active={isOn} color={color} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-white/50">
            {displayValue}{unit && ` ${unit}`}
          </p>
        </div>
      </div>
    </GlassCard>
  );
});
