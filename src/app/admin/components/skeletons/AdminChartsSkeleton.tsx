/**
 * Skeleton loading para AdminCharts
 */

export function AdminChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Hourly chart skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Status distribution skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-full animate-pulse mx-auto" style={{ width: 200, height: 200 }} />
      </div>
    </div>
  )
}
