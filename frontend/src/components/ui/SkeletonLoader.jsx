import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      {[1, 2, 3, 4, 5].map((idx) => (
        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 animate-pulse space-y-4 h-64 flex flex-col justify-between">
      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      <div className="flex items-end justify-between gap-2 h-40 pt-4">
        {[40, 65, 80, 50, 90, 70, 85].map((height, idx) => (
          <div
            key={idx}
            className="w-full bg-gray-200 rounded-t"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'table') return <SkeletonTable />;
  if (type === 'chart') return <SkeletonChart />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}
