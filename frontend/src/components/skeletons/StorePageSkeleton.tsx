import { Skeleton } from '@/components/ui/skeleton';

export default function StorePageSkeleton() {
  return (
    <main className="transition-all duration-300 flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Store Info Section */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="h-10 w-28" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </main>
  );
}
