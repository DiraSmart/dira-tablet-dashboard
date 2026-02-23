import { useTranslation } from 'react-i18next';
import { DomainView } from './DomainView';
import { CameraCard } from '@/components/cards/CameraCard';
import { mdiVideo } from '@/utils/iconMap';

export function CamerasView() {
  const { t } = useTranslation();
  return (
    <DomainView
      domains={['camera']}
      CardComponent={CameraCard}
      title={t('cameras.title')}
      emptyIcon={mdiVideo}
      emptyMessage={t('cameras.idle')}
    />
  );
}
