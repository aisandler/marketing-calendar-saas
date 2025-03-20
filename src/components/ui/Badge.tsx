import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-0.5 text-sm',
        size === 'lg' && 'px-3 py-1 text-base',
        variant === 'default' && 'bg-gray-100 text-gray-800',
        variant === 'outline' && 'bg-transparent border border-gray-300 text-gray-700',
        variant === 'success' && 'bg-green-100 text-green-800',
        variant === 'warning' && 'bg-amber-100 text-amber-800',
        variant === 'error' && 'bg-red-100 text-red-800',
        className
      )}
      {...props}
    />
  );
}; 