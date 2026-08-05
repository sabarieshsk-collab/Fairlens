export function Skeleton({ className = '', variant = 'text', width, height, count = 1 }) {
  const baseStyles = 'animate-pulse bg-[#e5e7eb] rounded';
  
  const variants = {
    text: 'h-4',
    title: 'h-6 w-3/4',
    card: 'h-48 w-full rounded-xl',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    metric: 'h-8 w-1/2',
    tableRow: 'h-12 w-full',
    chart: 'h-64 w-full',
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  ));

  return <div className="space-y-3">{items}</div>;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#e5e7eb] p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="avatar" />
        <div className="space-y-2">
          <Skeleton variant="title" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ columns = 4, rows = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
      <div className="p-4 border-b border-[#e5e7eb]">
        <div className="flex gap-4">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / columns}%`} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[#e5e7eb]">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }, (_, j) => (
                <Skeleton key={j} variant="text" width={`${100 / columns}%`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#e5e7eb] p-6 ${className}`}>
      <div className="mb-4">
        <Skeleton variant="title" width="50%" />
      </div>
      <div className="h-64">
        <Skeleton variant="chart" />
      </div>
    </div>
  );
}

export function SkeletonMetricCard({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl border ${className}`}>
      <Skeleton variant="avatar" className="w-12 h-12" />
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="metric" />
      </div>
    </div>
  );
}