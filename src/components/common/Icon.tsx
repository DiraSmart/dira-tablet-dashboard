import { memo } from 'react';

interface IconProps {
  path: string;
  size?: number;
  className?: string;
}

export const Icon = memo(function Icon({ path, size = 24, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
});
