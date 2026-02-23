import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarItem } from './SidebarItem';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { Icon } from '@/components/common/Icon';
import { useAppStore } from '@/store/appStore';
import { useEntityStore } from '@/store/entityStore';
import { SIDEBAR_ICONS } from '@/utils/iconMap';
import { mdiPencil, mdiCheck } from '@mdi/js';
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
  const editMode = useAppStore((s) => s.editMode);
  const toggleEditMode = useAppStore((s) => s.toggleEditMode);
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

      {/* Edit Mode Toggle */}
      <div className="px-2 py-2 border-t border-glass-border">
        <button
          onClick={toggleEditMode}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
            editMode
              ? 'bg-accent-light/20 text-accent-light'
              : 'text-white/50 hover:bg-white/5 hover:text-white/70'
          }`}
        >
          <Icon path={editMode ? mdiCheck : mdiPencil} size={20} />
          <span className="hidden lg:block">
            {editMode ? t('edit.exitEdit') : t('edit.editMode')}
          </span>
        </button>
      </div>

      {/* Connection Status */}
      <ConnectionStatus />
    </aside>
  );
});
