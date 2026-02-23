import { useTranslation } from 'react-i18next';
import { DomainView } from './DomainView';
import { LightCard } from '@/components/cards/LightCard';
import { mdiLightbulbGroup } from '@/utils/iconMap';

export function LightsView() {
  const { t } = useTranslation();
  return (
    <DomainView
      domains={['light']}
      CardComponent={LightCard}
      title={t('lights.title')}
      emptyIcon={mdiLightbulbGroup}
      emptyMessage={t('lights.allOff')}
    />
  );
}
