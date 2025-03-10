import { SkeletonCircle, SkeletonText } from '../ui/Skeleton';

export function BrandListSkeleton() {
  // Create an array of 5 items to show as loading state
  const items = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <ul className="divide-y divide-gray-200">
        {items.map((index) => (
          <li
            key={index}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center space-x-3">
              <SkeletonCircle size={24} />
              <div className="space-y-2">
                <SkeletonText className="h-4 w-32" />
                <SkeletonText className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <SkeletonCircle size={20} />
              <SkeletonCircle size={20} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 