interface PaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
      aria-label="Inventory pagination"
    >
      <p className="text-sm text-secondary-500">
        Showing <span className="font-medium text-secondary-800">{first}</span>&ndash;
        <span className="font-medium text-secondary-800">{last}</span> of{' '}
        <span className="font-medium text-secondary-800">{totalCount}</span> SKUs
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-sm text-secondary-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
