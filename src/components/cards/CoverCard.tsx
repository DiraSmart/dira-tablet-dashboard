import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { IconPill } from '@/components/common/IconPill';
import { useFillBarDrag } from '@/hooks/useFillBarDrag';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { openCover, closeCover, stopCover, setCoverPosition } from '@/api/services';
import { getEntityName, getCoverPosition } from '@/utils/entityHelpers';
import { getEntityIcon } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

interface CoverCardProps {
  entityId: string;
}

const COVER_COLOR = '#8B5CF6';

export const CoverCard = memo(function CoverCard({ entityId }: CoverCardProps) {
  const entity = useEntity(entityId);
  const { connection } = useHAConnection();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    if (!connection) return;
    if (entity?.state === 'open') {
      closeCover(connection, entityId);
    } else {
      openCover(connection, entityId);
    }
  }, [connection, entityId, entity?.state]);

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
    (percent: number) => {
      if (connection) setCoverPosition(connection, entityId, Math.max(0, Math.min(100, percent)));
    },
    [connection, entityId],
  );

  const { containerRef, handlePointerDown, handlePointerMove, handlePointerUp, isDragging } =
    useFillBarDrag({
      onTap: () => setExpanded((v) => !v),
      onChange: handlePosition,
    });

  if (!entity) return null;

  const isOpen = entity.state === 'open';
  const position = getCoverPosition(entity);
  const fillPercent = position !== null ? position : (isOpen ? 100 : 0);
  const name = getEntityName(entity);
  const icon = getEntityIcon(entity);

  return (
    <GlassCard
      ref={containerRef}
      glowColor={isOpen ? COVER_COLOR : undefined}
      fillPercent={fillPercent}
      fillColor={COVER_COLOR}
      noTransition={isDragging.current}
    >
      <div
        className="flex items-center gap-3 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <IconPill icon={icon} active={isOpen} color={COVER_COLOR} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-white/50">
            {t(`covers.${entity.state}`, entity.state)}
            {position !== null && ` · ${position}%`}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleOpen}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-touch',
              isOpen ? `bg-[${COVER_COLOR}]/20 text-[${COVER_COLOR}]` : 'bg-white/5 text-white/70 hover:bg-white/10',
            )}
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
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-touch',
              !isOpen ? `bg-[${COVER_COLOR}]/20 text-[${COVER_COLOR}]` : 'bg-white/5 text-white/70 hover:bg-white/10',
            )}
          >
            {t('covers.closed')}
          </button>
        </div>
      )}
    </GlassCard>
  );
});
