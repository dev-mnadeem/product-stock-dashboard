'use client'

import { type ChangeEvent, useCallback } from 'react'
import { SORT_FIELDS, type SortDirection, type SortField } from '@/types/product'

export type ViewMode = 'table' | 'grid'

interface InventoryToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onSortChange: (field: SortField, direction: SortDirection) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

const SORT_LABELS: Record<SortField, string> = {
  name: 'Name',
  price: 'Price',
  stock: 'Units on hand',
  updatedAt: 'Last updated',
}

/** Search, ordering and the table/grid switch. */
export function InventoryToolbar({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  view,
  onViewChange,
}: InventoryToolbarProps) {
  const handleSortField = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onSortChange(event.target.value as SortField, sortDirection)
    },
    [onSortChange, sortDirection]
  )

  const toggleDirection = useCallback(() => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')
  }, [onSortChange, sortField, sortDirection])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="inventory-search" className="field-label mb-1">
          Search catalogue
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="inventory-search"
            type="search"
            className="field-input pl-9"
            placeholder="Name, SKU or description"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="w-full sm:w-52">
        <label htmlFor="sort-field" className="field-label mb-1">
          Sort by
        </label>
        <div className="flex gap-2">
          <select
            id="sort-field"
            className="field-input"
            value={sortField}
            onChange={handleSortField}
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleDirection}
            className="rounded-lg border border-secondary-300 bg-white px-3 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100"
            aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div
        className="inline-flex self-start rounded-lg border border-secondary-300 bg-white p-0.5"
        role="group"
        aria-label="Layout"
      >
        {(['table', 'grid'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewChange(mode)}
            aria-pressed={view === mode}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              view === mode
                ? 'bg-primary-500 text-white'
                : 'text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
