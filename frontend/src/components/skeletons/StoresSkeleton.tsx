export default function StoresSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-2 w-full">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-8 w-16 bg-gray-300 rounded-md" />
      </div>
    </div>
  );
}
