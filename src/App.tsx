import { useEffect, type ComponentType } from 'react';
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
  const config = useConfigStore((s) => s.config);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const { connect, status } = useHAConnection();
  const activeView = useAppStore((s) => s.activeView);
  const selectedAreaId = useAppStore((s) => s.selectedAreaId);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Auto-connect if config has credentials
  useEffect(() => {
    if (config?.hassUrl && config?.hassToken && status === 'disconnected') {
      connect({ hassUrl: config.hassUrl, accessToken: config.hassToken }).catch(() => {
        // Will be handled by SetupView
      });
    }
  }, [config?.hassUrl, config?.hassToken, status, connect]);

  // Show setup if no config or not connected
  if (!config?.hassUrl || !config?.hassToken) {
    return <SetupView />;
  }

  if (status === 'connecting') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Connecting to Home Assistant...</p>
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
