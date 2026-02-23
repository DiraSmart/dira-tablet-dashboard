import { memo } from 'react';
import { getDomain } from '@/utils/entityHelpers';
import { LightCard } from './LightCard';
import { ClimateCard } from './ClimateCard';
import { CoverCard } from './CoverCard';
import { LockCard } from './LockCard';
import { SensorCard } from './SensorCard';
import { CameraCard } from './CameraCard';

interface EntityCardProps {
  entityId: string;
}

export const EntityCard = memo(function EntityCard({ entityId }: EntityCardProps) {
  const domain = getDomain(entityId);

  switch (domain) {
    case 'light':
      return <LightCard entityId={entityId} />;
    case 'climate':
      return <ClimateCard entityId={entityId} />;
    case 'cover':
      return <CoverCard entityId={entityId} />;
    case 'lock':
      return <LockCard entityId={entityId} />;
    case 'camera':
      return <CameraCard entityId={entityId} />;
    case 'sensor':
    case 'binary_sensor':
      return <SensorCard entityId={entityId} />;
    case 'switch':
      return <LightCard entityId={entityId} />;
    default:
      return <SensorCard entityId={entityId} />;
  }
});
