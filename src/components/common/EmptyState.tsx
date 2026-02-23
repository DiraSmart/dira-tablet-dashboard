import { memo } from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
}

export const EmptyState = memo(function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <Icon path={icon} size={48} className="text-white/20 mb-4" />
      <h3 className="text-lg font-medium text-white/60 mb-1">{title}</h3>
      {description && <p className="text-sm text-white/40 max-w-sm">{description}</p>}
    </div>
  );
});
