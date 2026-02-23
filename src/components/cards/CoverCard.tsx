import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { Slider } from '@/components/controls/Slider';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { openCover, closeCover, stopCover, setCoverPosition } from '@/api/services';
import { getEntityName, getCoverPosition } from '@/utils/entityHelpers';
import { mdiBlindsHorizontal } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

interface CoverCardProps {
  entityId: string;
}

export const CoverCard = memo(function CoverCard({ entityId }: CoverCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleOpen = useCallback(() => {
    if (connection) openCover(connection, entityId);
  }, [connection, entityId]);

  const handleClose = useCallback(() => {
    if (connection) closeCover(connection, entityId);
  }, [connection, entityId]);

  const handleStop = useCallback(() => {
    if (connection) stopCover(connection, entityId);
  }, [connection, entityId]);

  const handlePosition = useCallback(
    (value: number) => {
      if (connection) setCoverPosition(connection, entityId, value);
    },
    [connection, entityId],
  );

  if (!entity) return null;

  const isOpen = entity.state === 'open';
  const position = getCoverPosition(entity);
  const name = getEntityName(entity);

  return (
    <GlassCard glowColor={isOpen ? '#8B5CF6' : undefined}>
      <div className="flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isOpen ? 'bg-accent-cover/20 text-accent-cover' : 'bg-white/5 text-white/30',
            )}
          >
            <Icon path={mdiBlindsHorizontal} size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-white/50">
              {t(`covers.${entity.state}`, entity.state)}
              {position !== null && ` · ${position}%`}
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 min-h-touch"
            >
              {t('covers.open')}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 min-h-touch"
            >
              Stop
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 min-h-touch"
            >
              {t('covers.closed')}
            </button>
          </div>
          {position !== null && (
            <div>
              <p className="text-xs text-white/40 mb-1">{t('covers.position')}: {position}%</p>
              <Slider value={position} onChange={handlePosition} color="#8B5CF6" />
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
});
