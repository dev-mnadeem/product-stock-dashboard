'use client'

import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { InventoryStats } from '@/components/InventoryStats'
import { InventoryToolbar, type ViewMode } from '@/components/InventoryToolbar'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/components/ProductCard'
import { ProductFilters } from '@/components/ProductFilters'
import { ProductTable } from '@/components/ProductTable'
import { TableSkeleton } from '@/components/TableSkeleton'
import { Button } from '@/components/ui/Button'
import { useInventory } from '@/hooks/useInventory'
import type { FilterOptions, SortDirection, SortField } from '@/types/product'

export default function InventoryPage() {
  const {
    query,
    searchTerm,
    page,
    summary,
    loading,
    error,
    adjustmentError,
    pendingAdjustmentId,
    setSearchTerm,
    setQuery,
    resetQuery,
    goToPage,
    reload,
    adjustStock,
    dismissAdjustmentError,
  } = useInventory()

  const [view, setView] = useState<ViewMode>('table')

  const filters = useMemo<FilterOptions>(
    () => ({
      category: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
    }),
    [query.category, query.minPrice, query.maxPrice, query.inStock]
  )

  // `ProductFilters` speaks the `useState` setter contract, so translate here
  // rather than leaking the query-patch shape into a presentational component.
  const handleFiltersChange = useCallback<Dispatch<SetStateAction<FilterOptions>>>(
    (action) => {
      setQuery(typeof action === 'function' ? action(filters) : action)
    },
    [filters, setQuery]
  )

  const handleSortChange = useCallback(
    (sortField: SortField, sortDirection: SortDirection) => {
      setQuery({ sortField, sortDirection })
    },
    [setQuery]
  )

  const hasActiveQuery = Boolean(
    query.search ||
    query.category ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.inStock !== undefined
  )

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-900">
            Inventory
          </h1>
          <p className="text-sm text-secondary-500">
            Live stock levels for every SKU in the catalogue. Adjust a count and it is written
            straight through to the data layer.
          </p>
        </div>

        <InventoryStats summary={summary} />

        <div className="space-y-3">
          <InventoryToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortField={query.sortField ?? 'stock'}
            sortDirection={query.sortDirection ?? 'asc'}
            onSortChange={handleSortChange}
            view={view}
            onViewChange={setView}
          />
          <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800"
          >
            <span>{error}</span>
            <Button size="sm" variant="danger" onClick={reload}>
              Retry
            </Button>
          </div>
        )}

        {adjustmentError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900 animate-fade-in"
          >
            <span>
              <strong className="font-semibold">Stock change reverted.</strong>{' '}
              {adjustmentError}
            </span>
            <Button size="sm" variant="outline" onClick={dismissAdjustmentError}>
              Dismiss
            </Button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={query.pageSize ?? 6} />
        ) : page.items.length === 0 ? (
          <EmptyState
            title={hasActiveQuery ? 'No SKUs match this view' : 'The catalogue is empty'}
            description={
              hasActiveQuery
                ? 'Loosen the filters or clear the search box to see the rest of the catalogue.'
                : 'Add your first product to start tracking stock levels.'
            }
            action={
              hasActiveQuery ? (
                <Button variant="outline" onClick={resetQuery}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : view === 'table' ? (
          <ProductTable
            products={page.items}
            pendingAdjustmentId={pendingAdjustmentId}
            onAdjustStock={adjustStock}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {page.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && page.items.length > 0 && (
          <Pagination
            page={page.page}
            totalPages={page.totalPages}
            totalCount={page.totalCount}
            pageSize={page.pageSize}
            onPageChange={goToPage}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
