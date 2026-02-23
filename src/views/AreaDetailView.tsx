import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityCard } from '@/components/cards/EntityCard';
import { Icon } from '@/components/common/Icon';
import { EditableCardWrapper } from '@/components/common/EditOverlay';
import { useConfigStore } from '@/store/configStore';
import { useEntityStore } from '@/store/entityStore';
import { useAppStore } from '@/store/appStore';
import { mdiChevronLeft } from '@/utils/iconMap';
import { getDomain } from '@/utils/entityHelpers';

interface AreaDetailViewProps {
  areaId: string;
}

const DOMAIN_ORDER = ['light', 'climate', 'cover', 'camera', 'lock', 'switch', 'sensor', 'binary_sensor'];

export const AreaDetailView = memo(function AreaDetailView({ areaId }: AreaDetailViewProps) {
  const { t } = useTranslation();
  const area = useConfigStore((s) => s.config?.areas.find((a) => a.areaId === areaId));
  const entities = useEntityStore((s) => s.entities);
  const navigateBack = useAppStore((s) => s.navigateBack);

  const groupedEntities = useMemo(() => {
    if (!area) return [];
    const groups = new Map<string, string[]>();

    for (const id of area.entityIds) {
      if (!entities[id]) continue;
      const domain = getDomain(id);
      const list = groups.get(domain) || [];
      list.push(id);
      groups.set(domain, list);
    }

    return DOMAIN_ORDER
      .filter((d) => groups.has(d))
      .map((d) => ({ domain: d, entityIds: groups.get(d)! }))
      .concat(
        [...groups.entries()]
          .filter(([d]) => !DOMAIN_ORDER.includes(d))
          .map(([d, ids]) => ({ domain: d, entityIds: ids })),
      );
  }, [area, entities]);

  if (!area) return null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={navigateBack}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
        >
          <Icon path={mdiChevronLeft} size={24} />
        </button>
        <h1 className="text-2xl font-semibold text-white">{area.displayName}</h1>
      </div>

      {groupedEntities.map((group) => (
        <section key={group.domain}>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            {t(`sidebar.${group.domain === 'light' ? 'lights' : group.domain === 'climate' ? 'climate' : group.domain === 'cover' ? 'covers' : group.domain === 'camera' ? 'cameras' : group.domain === 'lock' ? 'security' : group.domain}`, group.domain)}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.entityIds.map((id) => (
              <EditableCardWrapper key={id} entityId={id}>
                <EntityCard entityId={id} />
              </EditableCardWrapper>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
