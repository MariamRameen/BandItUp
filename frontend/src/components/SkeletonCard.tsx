import React from 'react';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasTitle?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  className = '', 
  lines = 3, 
  hasTitle = true 
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm animate-pulse ${className}`}>
    {hasTitle && (
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
    )}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded" 
          style={{ width: `${85 - i * 15}%` }} 
        />
      ))}
    </div>
  </div>
);

// Skeleton for stat cards (small cards with single value)
export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  </div>
);

// Skeleton for larger content cards
export const SkeletonContentCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-[#F0E8FF] dark:border-gray-700 shadow-sm animate-pulse ${className}`}>
    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
  </div>
);

export default SkeletonCard;
