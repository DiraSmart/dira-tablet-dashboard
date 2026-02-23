import { memo } from 'react';
import { Icon } from './Icon';
import { cn } from '@/utils/cn';

interface IconPillProps {
  icon: string;
  active?: boolean;
  color?: string;
  size?: number;
}

export const IconPill = memo(function IconPill({
  icon,
  active = false,
  color = '#F59E0B',
  size = 20,
}: IconPillProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200',
      )}
      style={
        active
          ? { backgroundColor: `${color}33`, color }
          : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
      }
    >
      <Icon path={icon} size={size} />
    </div>
  );
});
