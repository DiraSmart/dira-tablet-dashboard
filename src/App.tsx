import { useEffect, useRef, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { HAConnectionProvider, useHAConnection } from '@/context/HAConnectionContext';
import { useConfigStore } from '@/store/configStore';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { SetupView } from '@/views/SetupView';
import { HomeView } from '@/views/HomeView';
import { LightsView } from '@/views/LightsView';
import { ClimateView } from '@/views/ClimateView';
import { CoversView } from '@/views/CoversView';
import { CamerasView } from '@/views/CamerasView';
import { SecurityView } from '@/views/SecurityView';
import { AreaDetailView } from '@/views/AreaDetailView';
import { SettingsView } from '@/views/SettingsView';
import { fetchAreas, fetchDevices, fetchEntityRegistry } from '@/api/areas';
import type { ViewId } from '@/types/navigation';

const VIEW_MAP: Record<ViewId, ComponentType> = {
  home: HomeView,
  lights: LightsView,
  climate: ClimateView,
  covers: CoversView,
  cameras: CamerasView,
  security: SecurityView,
  settings: SettingsView,
};

function DashboardContent() {
  const { t } = useTranslation();
  const config = useConfigStore((s) => s.config);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const setConfig = useConfigStore((s) => s.setConfig);
  const { connection, connect, status, authMode } = useHAConnection();
  const activeView = useAppStore((s) => s.activeView);
  const selectedAreaId = useAppStore((s) => s.selectedAreaId);
  const discoveryDone = useRef(false);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Standalone mode: auto-connect if config has credentials
  useEffect(() => {
    if (authMode === 'standalone' && config?.hassUrl && config?.hassToken && status === 'disconnected') {
      connect({ hassUrl: config.hassUrl, accessToken: config.hassToken }).catch(() => {});
    }
  }, [authMode, config?.hassUrl, config?.hassToken, status, connect]);

  // Auto-discovery when connected and no config yet (ingress mode)
  useEffect(() => {
    if (connection && !config?.areas?.length && !discoveryDone.current) {
      discoveryDone.current = true;
      (async () => {
        try {
          const [areas, devices, entities] = await Promise.all([
            fetchAreas(connection),
            fetchDevices(connection),
            fetchEntityRegistry(connection),
          ]);
          const res = await fetch('./api/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hassUrl: window.location.origin,
              hassToken: '',
              areas,
              devices,
              entities,
            }),
          });
          const newConfig = await res.json();
          setConfig(newConfig);
        } catch {
          // Discovery failed, will show empty state
        }
      })();
    }
  }, [connection, config, setConfig]);

  // Ingress mode: skip setup, show loading or dashboard
  if (authMode === 'ingress') {
    if (status === 'connecting' || (status === 'connected' && !config?.areas?.length)) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">{t('setup.connecting')}</p>
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-red-400 text-lg font-medium mb-2">{t('setup.error')}</p>
            <p className="text-white/50 text-sm">{t('setup.errorDesc')}</p>
          </div>
        </div>
      );
    }
  }

  // Standalone mode: show setup if no config
  if (authMode === 'standalone' && (!config?.hassUrl || !config?.hassToken)) {
    return <SetupView />;
  }

  // Still detecting auth mode
  if (authMode === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Standalone connecting
  if (status === 'connecting') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">{t('setup.connecting')}</p>
        </div>
      </div>
    );
  }

  const ViewComponent = VIEW_MAP[activeView] || HomeView;

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[68px] lg:ml-60 overflow-y-auto scrollbar-thin">
        {selectedAreaId ? (
          <AreaDetailView areaId={selectedAreaId} />
        ) : (
          <ViewComponent />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HAConnectionProvider>
      <DashboardContent />
    </HAConnectionProvider>
  );
}
