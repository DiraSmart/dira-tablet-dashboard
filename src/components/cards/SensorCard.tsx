import { memo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { useDebouncedEntity } from '@/hooks/useDebouncedEntity';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiEye } from '@/utils/iconMap';

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

  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/30 shrink-0">
          <Icon path={mdiEye} size={20} />
        </div>
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
