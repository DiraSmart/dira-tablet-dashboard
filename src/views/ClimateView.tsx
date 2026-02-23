import { useTranslation } from 'react-i18next';
import { DomainView } from './DomainView';
import { ClimateCard } from '@/components/cards/ClimateCard';
import { mdiThermometer } from '@/utils/iconMap';

export function ClimateView() {
  const { t } = useTranslation();
  return (
    <DomainView
      domains={['climate']}
      CardComponent={ClimateCard}
      title={t('climate.title')}
      emptyIcon={mdiThermometer}
      emptyMessage={t('climate.off')}
    />
  );
}
