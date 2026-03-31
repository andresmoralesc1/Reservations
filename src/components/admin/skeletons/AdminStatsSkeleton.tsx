/**
 * Skeleton loading para AdminStats
 */

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
        >
          <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
