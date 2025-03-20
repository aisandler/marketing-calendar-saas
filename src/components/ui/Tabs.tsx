import React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Tabs: React.FC<TabsProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('w-full', className)}
      {...props}
    />
  );
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList: React.FC<TabsListProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'flex space-x-1 rounded-md border-b border-gray-200 mb-4',
        className
      )}
      {...props}
    />
  );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  className, 
  isActive,
  ...props 
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-t-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'border-b-2 border-blue-600 text-blue-600' 
          : 'text-gray-500 hover:text-gray-700',
        className
      )}
      {...props}
    />
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  activeValue?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  className,
  value,
  activeValue,
  ...props 
}) => {
  const isVisible = value === activeValue;
  
  return (
    <div
      className={cn(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
        isVisible ? 'block' : 'hidden',
        className
      )}
      {...props}
    />
  );
}; 