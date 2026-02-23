import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarItem } from './SidebarItem';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { useAppStore } from '@/store/appStore';
import { useEntityStore } from '@/store/entityStore';
import { SIDEBAR_ICONS } from '@/utils/iconMap';
import type { ViewId } from '@/types/navigation';

interface SidebarEntry {
  id: ViewId;
  icon: string;
}

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { id: 'home', icon: SIDEBAR_ICONS.home },
  { id: 'lights', icon: SIDEBAR_ICONS.lights },
  { id: 'climate', icon: SIDEBAR_ICONS.climate },
  { id: 'covers', icon: SIDEBAR_ICONS.covers },
  { id: 'cameras', icon: SIDEBAR_ICONS.cameras },
  { id: 'security', icon: SIDEBAR_ICONS.security },
  { id: 'settings', icon: SIDEBAR_ICONS.settings },
];

export const Sidebar = memo(function Sidebar() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const entities = useEntityStore((s) => s.entities);

  const counts = useMemo(() => {
    const all = Object.values(entities);
    return {
      lights: all.filter((e) => e.entity_id.startsWith('light.') && e.state === 'on').length,
      climate: all.filter((e) => e.entity_id.startsWith('climate.')).length,
      covers: all.filter((e) => e.entity_id.startsWith('cover.')).length,
      cameras: all.filter((e) => e.entity_id.startsWith('camera.')).length,
      security: all.filter(
        (e) => e.entity_id.startsWith('lock.') || e.entity_id.startsWith('alarm_control_panel.'),
      ).length,
    };
  }, [entities]);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[68px] lg:w-60 bg-surface-elevated border-r border-glass-border flex flex-col z-50">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-glass-border">
        <span className="text-xl font-bold text-white tracking-tight hidden lg:block">
          {t('app.name')}
        </span>
        <span className="text-xl font-bold text-white lg:hidden">D</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
        {SIDEBAR_ENTRIES.map((entry) => (
          <SidebarItem
            key={entry.id}
            icon={entry.icon}
            label={t(`sidebar.${entry.id}`)}
            count={(counts as any)[entry.id]}
            active={activeView === entry.id}
            onClick={() => setActiveView(entry.id)}
          />
        ))}
      </nav>

      {/* Connection Status */}
      <ConnectionStatus />
    </aside>
  );
});
