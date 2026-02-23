import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/common/GlassCard';
import { useHAConnection } from '@/context/HAConnectionContext';
import { useConfigStore } from '@/store/configStore';
import { connectToHA } from '@/api/connection';
import { fetchAreas, fetchDevices, fetchEntityRegistry } from '@/api/areas';
import { cn } from '@/utils/cn';

export const SetupView = memo(function SetupView() {
  const { t, i18n } = useTranslation();
  const { connect, status } = useHAConnection();
  const setConfig = useConfigStore((s) => s.setConfig);
  const [hassUrl, setHassUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isConnecting = status === 'connecting';

  const handleConnect = async () => {
    if (!hassUrl || !token) return;

    setError(null);
    try {
      // Clean URL
      const cleanUrl = hassUrl.replace(/\/+$/, '');

      // Connect to HA
      await connect({ hassUrl: cleanUrl, accessToken: token });

      // Create a separate connection for discovery
      const conn = await connectToHA({ hassUrl: cleanUrl, accessToken: token });

      // Fetch discovery data
      const [areas, devices, entities] = await Promise.all([
        fetchAreas(conn),
        fetchDevices(conn),
        fetchEntityRegistry(conn),
      ]);

      // Send to backend to generate config
      const res = await fetch('./api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hassUrl: cleanUrl, hassToken: token, areas, devices, entities }),
      });

      const config = await res.json();
      setConfig(config);

      // Close the extra connection
      conn.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.errorDesc'));
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-surface p-6">
      <GlassCard className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('setup.title')}</h1>
          <p className="text-sm text-white/50">{t('setup.subtitle')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">{t('setup.hassUrl')}</label>
            <input
              type="url"
              value={hassUrl}
              onChange={(e) => setHassUrl(e.target.value)}
              placeholder={t('setup.hassUrlPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">{t('setup.token')}</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('setup.tokenPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors"
            />
            <p className="text-xs text-white/30 mt-1.5">{t('setup.tokenHelp')}</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting || !hassUrl || !token}
            className={cn(
              'w-full py-3 rounded-xl font-medium text-sm transition-all min-h-touch',
              isConnecting || !hassUrl || !token
                ? 'bg-blue-500/20 text-blue-300/50 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]',
            )}
          >
            {isConnecting ? t('setup.connecting') : t('setup.connect')}
          </button>
        </div>

        {/* Language Switcher */}
        <div className="mt-6 flex justify-center gap-2">
          {['es', 'en'].map((lang) => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                i18n.language === lang
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60',
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
});
