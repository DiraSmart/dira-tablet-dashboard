import { memo, useMemo, type ComponentType } from 'react';
import { useEntityStore } from '@/store/entityStore';
import { useConfigStore } from '@/store/configStore';
import { EmptyState } from '@/components/common/EmptyState';
import { EditableCardWrapper } from '@/components/common/EditOverlay';

interface DomainViewProps {
  domains: string[];
  CardComponent: ComponentType<{ entityId: string }>;
  title: string;
  emptyIcon: string;
  emptyMessage: string;
}

export const DomainView = memo(function DomainView({
  domains,
  CardComponent,
  title,
  emptyIcon,
  emptyMessage,
}: DomainViewProps) {
  const allEntities = useEntityStore((s) => s.entities);
  const config = useConfigStore((s) => s.config);

  const matchingEntityIds = useMemo(() => {
    return new Set(
      Object.keys(allEntities).filter((id) => domains.some((d) => id.startsWith(d + '.'))),
    );
  }, [allEntities, domains]);

  const groupedByArea = useMemo(() => {
    if (!config) return [];
    const groups: { areaName: string; areaId: string; entityIds: string[] }[] = [];
    const usedIds = new Set<string>();

    for (const area of config.areas.filter((a) => a.visible).sort((a, b) => a.order - b.order)) {
      const areaEntityIds = area.entityIds.filter((id) => matchingEntityIds.has(id));
      if (areaEntityIds.length > 0) {
        groups.push({ areaName: area.displayName, areaId: area.areaId, entityIds: areaEntityIds });
        areaEntityIds.forEach((id) => usedIds.add(id));
      }
    }

    const ungrouped = [...matchingEntityIds].filter((id) => !usedIds.has(id));
    if (ungrouped.length > 0) {
      groups.push({ areaName: 'Other', areaId: '__ungrouped', entityIds: ungrouped });
    }

    return groups;
  }, [config, matchingEntityIds]);

  if (groupedByArea.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyMessage} />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      {groupedByArea.map((group) => (
        <section key={group.areaId}>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            {group.areaName}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.entityIds.map((id) => (
              <EditableCardWrapper key={id} entityId={id}>
                <CardComponent entityId={id} />
              </EditableCardWrapper>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
