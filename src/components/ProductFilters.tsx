'use client'

import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
} from 'react'
import { PRODUCT_CATEGORIES, type FilterOptions } from '@/types/product'
import { formatPrice } from '@/utils/formatters'

interface ProductFiltersProps {
  filters: FilterOptions
  onFiltersChange: Dispatch<SetStateAction<FilterOptions>>
}

const EMPTY_FILTERS: FilterOptions = {
  category: '',
  minPrice: undefined,
  maxPrice: undefined,
  inStock: undefined,
}

const parsePrice = (raw: string): number | undefined => {
  if (raw.trim() === '') {
    return undefined
  }
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Filter controls only. Search and ordering live in `InventoryToolbar` so this
 * component stays a pure translation of four inputs into a `FilterOptions`.
 * Handlers use the updater form of `onFiltersChange` rather than closing over
 * `filters`, so two fast edits cannot clobber each other.
 */
export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const handleCategoryChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target
      onFiltersChange((previous) => ({ ...previous, category: value || undefined }))
    },
    [onFiltersChange]
  )

  const handleMinPriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const minPrice = parsePrice(event.target.value)
      onFiltersChange((previous) => ({ ...previous, minPrice }))
    },
    [onFiltersChange]
  )

  const handleMaxPriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const maxPrice = parsePrice(event.target.value)
      onFiltersChange((previous) => ({ ...previous, maxPrice }))
    },
    [onFiltersChange]
  )

  const handleStockChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target
      const inStock = value === '' ? undefined : value === 'true'
      onFiltersChange((previous) => ({ ...previous, inStock }))
    },
    [onFiltersChange]
  )

  const handleReset = useCallback(() => {
    onFiltersChange(() => ({ ...EMPTY_FILTERS }))
  }, [onFiltersChange])

  const summaryText = useMemo(() => {
    const parts: string[] = []

    if (filters.category) parts.push(`Category: ${filters.category}`)
    if (filters.minPrice !== undefined) parts.push(`Min: ${formatPrice(filters.minPrice)}`)
    if (filters.maxPrice !== undefined) parts.push(`Max: ${formatPrice(filters.maxPrice)}`)
    if (filters.inStock !== undefined) parts.push(filters.inStock ? 'In Stock' : 'Out of Stock')

    return parts.join(' • ')
  }, [filters])

  return (
    <section className="surface p-4" aria-label="Inventory filters">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
        <div>
          <label htmlFor="category-filter" className="field-label mb-1">
            Category
          </label>
          <select
            id="category-filter"
            className="field-input"
            value={filters.category ?? ''}
            onChange={handleCategoryChange}
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="min-price" className="field-label mb-1">
            Min price
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="field-input tabular"
            value={filters.minPrice ?? ''}
            onChange={handleMinPriceChange}
          />
        </div>

        <div>
          <label htmlFor="max-price" className="field-label mb-1">
            Max price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="999.99"
            className="field-input tabular"
            value={filters.maxPrice ?? ''}
            onChange={handleMaxPriceChange}
          />
        </div>

        <div>
          <label htmlFor="stock-filter" className="field-label mb-1">
            Availability
          </label>
          <select
            id="stock-filter"
            className="field-input"
            value={filters.inStock === undefined ? '' : String(filters.inStock)}
            onChange={handleStockChange}
          >
            <option value="">All products</option>
            <option value="true">In stock only</option>
            <option value="false">Out of stock only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset all product filters"
          className="rounded-lg border border-secondary-300 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100"
        >
          Reset
        </button>
      </div>

      {summaryText && (
        <p className="mt-3 text-xs text-secondary-500" aria-live="polite">
          {summaryText}
        </p>
      )}
    </section>
  )
}
