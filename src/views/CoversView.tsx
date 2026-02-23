import { useTranslation } from 'react-i18next';
import { DomainView } from './DomainView';
import { CoverCard } from '@/components/cards/CoverCard';
import { mdiBlindsHorizontal } from '@/utils/iconMap';

export function CoversView() {
  const { t } = useTranslation();
  return (
    <DomainView
      domains={['cover']}
      CardComponent={CoverCard}
      title={t('covers.title')}
      emptyIcon={mdiBlindsHorizontal}
      emptyMessage={t('covers.closed')}
    />
  );
}
