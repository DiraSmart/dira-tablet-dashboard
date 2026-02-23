import { memo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { useEntity } from '@/store/entityStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { useConfigStore } from '@/store/configStore';
import { getEntityName } from '@/utils/entityHelpers';
import { mdiVideo } from '@/utils/iconMap';

interface CameraCardProps {
  entityId: string;
}

export const CameraCard = memo(function CameraCard({ entityId }: CameraCardProps) {
  const entity = useEntity(entityId);
  const { t } = useTranslation();
  const hassUrl = useConfigStore((s) => s.config?.hassUrl);
  const hassToken = useConfigStore((s) => s.config?.hassToken);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!entity) return null;

  const name = getEntityName(entity);
  const entityPicture = entity.attributes.entity_picture;
  const imageUrl = entityPicture && hassUrl
    ? `${hassUrl}${entityPicture}`
    : null;

  return (
    <GlassCard padding="none" ref={cardRef}>
      <div className="relative">
        {isVisible && imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-36 object-cover rounded-t-card"
            loading="lazy"
            crossOrigin={hassToken ? undefined : 'anonymous'}
          />
        ) : (
          <div className="w-full h-36 bg-white/5 rounded-t-card flex items-center justify-center">
            <Icon path={mdiVideo} size={32} className="text-white/20" />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-xs text-white/70">
          {entity.state === 'recording' ? t('cameras.live') : t('cameras.idle')}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{name}</p>
      </div>
    </GlassCard>
  );
});
