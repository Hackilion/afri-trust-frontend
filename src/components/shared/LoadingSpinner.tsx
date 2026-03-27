export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? 'py-16'}`}>
      <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className ?? 'h-4 w-full'}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-7 w-16" />
      <SkeletonLine className="h-3 w-32" />
    </div>
  );
}
