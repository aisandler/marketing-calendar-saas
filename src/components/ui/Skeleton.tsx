import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /**
   * The shape of the skeleton
   * @default 'rectangle'
   */
  variant?: 'rectangle' | 'circle' | 'text';
  /**
   * Whether to show the animation
   * @default true
   */
  animate?: boolean;
  /**
   * Width of the skeleton. Can be any valid CSS width value.
   */
  width?: string | number;
  /**
   * Height of the skeleton. Can be any valid CSS height value.
   */
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangle',
  animate = true,
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200',
        animate && 'animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded-md',
        variant === 'rectangle' && 'rounded-md',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      {...props}
    />
  );
}

export function SkeletonText({
  className,
  ...props
}: Omit<SkeletonProps, 'variant'>) {
  return (
    <Skeleton
      variant="text"
      className={cn('w-full h-4', className)}
      {...props}
    />
  );
}

export function SkeletonCircle({
  className,
  size = 40,
  ...props
}: Omit<SkeletonProps, 'variant' | 'width' | 'height'> & {
  size?: number;
}) {
  return (
    <Skeleton
      variant="circle"
      width={size}
      height={size}
      className={className}
      {...props}
    />
  );
}

export function SkeletonButton({
  className,
  ...props
}: Omit<SkeletonProps, 'variant'>) {
  return (
    <Skeleton
      variant="rectangle"
      className={cn('h-9 w-24', className)}
      {...props}
    />
  );
} 