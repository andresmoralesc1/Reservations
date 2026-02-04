import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
    />
  )
}

export function KPICardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-3" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-neutral-100">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4 text-center">
        <Skeleton className="h-4 w-8 mx-auto" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-6 py-4 text-right">
        <Skeleton className="h-8 w-20 ml-auto" />
      </td>
    </tr>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto bg-white border border-neutral-200">
      <table className="min-w-full">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-6 py-4 text-right font-display text-xs uppercase tracking-wider text-neutral-500">
              <Skeleton className="h-4 w-20" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
