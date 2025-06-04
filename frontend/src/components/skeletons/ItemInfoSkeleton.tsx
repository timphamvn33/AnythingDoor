export default function ItemInfoSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 animate-pulse">
      <div className="flex justify-end mb-4">
        <div className="h-4 w-4 bg-gray-300 rounded" />
      </div>
      <div className="h-5 bg-gray-300 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
      <div className="h-5 bg-gray-300 rounded w-1/4 ml-auto mt-4" />
    </div>
  );
}
