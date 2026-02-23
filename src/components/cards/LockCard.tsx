import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { lockEntity, unlockEntity } from '@/api/services';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiLock, mdiLockOpen } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

interface LockCardProps {
  entityId: string;
}

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

  return (
    <GlassCard onClick={handleToggle} glowColor={isLocked ? '#10B981' : '#EF4444'}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isLocked ? 'bg-accent-security/20 text-accent-security' : 'bg-red-500/20 text-red-400',
          )}
        >
          <Icon path={isLocked ? mdiLock : mdiLockOpen} size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className={cn('text-xs', isLocked ? 'text-green-400' : 'text-red-400')}>
            {isLocked ? t('security.locked') : t('security.unlocked')}
          </p>
        </div>
      </div>
    </GlassCard>
  );
});
