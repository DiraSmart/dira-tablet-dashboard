import { useTranslation } from 'react-i18next';
import { DomainView } from './DomainView';
import { LockCard } from '@/components/cards/LockCard';
import { mdiShieldHome } from '@/utils/iconMap';

export function SecurityView() {
  const { t } = useTranslation();
  return (
    <DomainView
      domains={['lock', 'alarm_control_panel']}
      CardComponent={LockCard}
      title={t('security.title')}
      emptyIcon={mdiShieldHome}
      emptyMessage={t('security.locked')}
    />
  );
}
