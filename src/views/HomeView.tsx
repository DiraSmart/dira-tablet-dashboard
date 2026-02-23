import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaCard } from '@/components/cards/AreaCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfigStore } from '@/store/configStore';
import { useAppStore } from '@/store/appStore';
import { mdiHome } from '@/utils/iconMap';

export const HomeView = memo(function HomeView() {
  const { t } = useTranslation();
  const areas = useConfigStore((s) => s.config?.areas);
  const navigateToArea = useAppStore((s) => s.navigateToArea);

  const visibleAreas = useMemo(
    () => areas?.filter((a) => a.visible).sort((a, b) => a.order - b.order) || [],
    [areas],
  );

  if (visibleAreas.length === 0) {
    return (
      <EmptyState
        icon={mdiHome}
        title={t('home.noAreas')}
        description={t('home.noAreasDesc')}
      />
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">{t('home.title')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleAreas.map((area) => (
          <AreaCard
            key={area.areaId}
            areaConfig={area}
            onClick={() => navigateToArea(area.areaId)}
          />
        ))}
      </div>
    </div>
  );
});
