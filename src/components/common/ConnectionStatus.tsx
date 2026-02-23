import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHAConnection } from '@/context/HAConnectionContext';
import { Icon } from './Icon';
import { mdiWifi, mdiWifiOff, mdiAlert } from '@/utils/iconMap';
import { cn } from '@/utils/cn';

export const ConnectionStatus = memo(function ConnectionStatus() {
  const { status } = useHAConnection();
  const { t } = useTranslation();

  const config = {
    connected: { icon: mdiWifi, color: 'text-green-400', label: t('connection.connected') },
    connecting: { icon: mdiWifi, color: 'text-yellow-400 animate-pulse', label: t('connection.connecting') },
    disconnected: { icon: mdiWifiOff, color: 'text-red-400', label: t('connection.disconnected') },
    error: { icon: mdiAlert, color: 'text-red-400', label: t('connection.error') },
  };

  const { icon, color, label } = config[status];

  return (
    <div className="px-4 py-3 border-t border-glass-border flex items-center gap-2">
      <Icon path={icon} size={16} className={cn(color)} />
      <span className={cn('text-xs', color)}>{label}</span>
    </div>
  );
});
