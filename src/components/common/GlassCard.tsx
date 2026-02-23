import { memo, forwardRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glowColor?: string;
  fillPercent?: number;
  fillColor?: string;
  noTransition?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const GlassCard = memo(
  forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
    { children, className, onClick, padding = 'md', glowColor, fillPercent, fillColor, noTransition },
    ref,
  ) {
    const hasFill = fillPercent !== undefined && fillColor;

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-card border border-glass-border bg-surface-card',
          'backdrop-blur-glass',
          'transition-all duration-200 ease-out',
          onClick && 'cursor-pointer hover:bg-glass-hover active:scale-[0.98]',
          paddingClasses[padding],
          className,
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={glowColor ? { boxShadow: `0 0 24px ${glowColor}25, 0 0 8px ${glowColor}15` } : undefined}
      >
        {hasFill && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none',
              !noTransition && 'transition-[width] duration-75',
            )}
            style={{
              width: `${Math.max(0, Math.min(100, fillPercent))}%`,
              backgroundColor: `${fillColor}25`,
            }}
          />
        )}
        <div className={hasFill ? 'relative z-10' : undefined}>{children}</div>
      </div>
    );
  }),
);
