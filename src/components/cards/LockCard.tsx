import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { lockEntity, unlockEntity } from '@/api/services';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiLock, mdiLockOpen } from '@/utils/iconMap';

interface LockCardProps {
  entityId: string;
}

const LOCK_COLOR = '#10B981';
const UNLOCK_COLOR = '#EF4444';

export const LockCard = memo(function LockCard({ entityId }: LockCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    if (!connection) return;
    if (entity?.state === 'locked') {
      unlockEntity(connection, entityId);
    } else {
      lockEntity(connection, entityId);
    }
  }, [connection, entityId, entity?.state]);

  if (!entity) return null;

  const isLocked = entity.state === 'locked';
  const name = getEntityName(entity);
  const color = isLocked ? LOCK_COLOR : UNLOCK_COLOR;

  return (
    <GlassCard
      onClick={handleToggle}
      glowColor={color}
      fillPercent={isLocked ? 100 : 0}
      fillColor={color}
    >
      <div className="flex items-center gap-3">
        <IconPill
          icon={isLocked ? mdiLock : mdiLockOpen}
          active
          color={color}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs" style={{ color }}>
            {isLocked ? t('security.locked') : t('security.unlocked')}
          </p>
        </div>
      </div>
    </GlassCard>
  );
});
