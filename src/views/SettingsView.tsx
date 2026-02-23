import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { useConfigStore } from '@/store/configStore';
import { useHAConnection } from '@/context/HAConnectionContext';
import { cn } from '@/utils/cn';

export const SettingsView = memo(function SettingsView() {
  const { t, i18n } = useTranslation();
  const config = useConfigStore((s) => s.config);
  const clearConfig = useConfigStore((s) => s.clearConfig);
  const { disconnect } = useHAConnection();

  const handleExport = async () => {
    try {
      const res = await fetch('./api/config/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dira-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        await fetch('./api/config/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imported),
        });
        window.location.reload();
      } catch {
        // ignore
      }
    };
    input.click();
  };

  const handleDisconnect = () => {
    disconnect();
    clearConfig();
    fetch('./api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-6">{t('settings.title')}</h1>

      <div className="space-y-4">
        {/* Language */}
        <GlassCard>
          <h3 className="text-sm font-medium text-white mb-3">{t('settings.language')}</h3>
          <div className="flex gap-2">
            {[
              { code: 'es', label: 'Espanol' },
              { code: 'en', label: 'English' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-touch',
                  i18n.language === lang.code
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/5 text-white/50 hover:bg-white/10',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Connection Info */}
        {config && (
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-2">Home Assistant</h3>
            <p className="text-xs text-white/50 mb-1">{config.hassUrl}</p>
            <p className="text-xs text-white/30">
              {config.areas.length} areas &middot;{' '}
              {config.areas.reduce((sum, a) => sum + a.entityIds.length, 0)} entities
            </p>
          </GlassCard>
        )}

        {/* Import / Export */}
        <GlassCard>
          <h3 className="text-sm font-medium text-white mb-3">Config</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors min-h-touch"
            >
              {t('settings.export')}
            </button>
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors min-h-touch"
            >
              {t('settings.import')}
            </button>
          </div>
        </GlassCard>

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors min-h-touch"
        >
          {t('settings.disconnect')}
        </button>
      </div>
    </div>
  );
});
