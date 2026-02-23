import { memo } from 'react';
import { Icon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';

interface SidebarItemProps {
  icon: string;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export const SidebarItem = memo(function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 min-h-touch',
        'transition-colors duration-150',
        'lg:px-6',
        active
          ? 'bg-white/10 text-white border-r-2 border-blue-400'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5',
      )}
    >
      <Icon path={icon} size={22} />
      <span className="hidden lg:block text-sm font-medium flex-1 text-left truncate">
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5',
            active ? 'bg-blue-400/20 text-blue-300' : 'bg-white/10 text-white/50',
            'hidden lg:flex',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
});
