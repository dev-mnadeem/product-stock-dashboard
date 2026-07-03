interface TableSkeletonProps {
  rows?: number
}

/**
 * Placeholder rows sized like real ones, so the table does not collapse and
 * reflow the page every time a filter changes.
 */
export function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <div className="surface overflow-hidden" role="status" aria-label="Loading inventory">
      <div className="divide-y divide-secondary-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-secondary-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-secondary-100" />
              <div className="h-3 w-1/5 animate-pulse rounded bg-secondary-100" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-secondary-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-secondary-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
