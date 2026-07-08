'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APP_CONFIG } from '@/config/app'
import { summarizeInventory } from '@/domain/query'
import type { ProductPage } from '@/domain/query'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { adjustStock as requestStockAdjustment, listProducts } from '@/lib/api'
import { toUserMessage } from '@/types/api'
import type { InventorySummary, Product, ProductQuery } from '@/types/product'

const EMPTY_PAGE: ProductPage = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: APP_CONFIG.pageSize,
  totalPages: 1,
}

export const INITIAL_QUERY: ProductQuery = {
  search: '',
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  inStock: undefined,
  // Lowest cover first: the rows that need a buyer's attention are the ones
  // worth putting at the top of an inventory screen.
  sortField: 'stock',
  sortDirection: 'asc',
  page: 1,
  pageSize: APP_CONFIG.pageSize,
}

export interface UseInventoryResult {
  query: ProductQuery
  /** Raw search text, updated on every keystroke. The request is debounced. */
  searchTerm: string
  page: ProductPage
  summary: InventorySummary | null
  loading: boolean
  error: string | null
  adjustmentError: string | null
  pendingAdjustmentId: string | null
  setSearchTerm: (value: string) => void
  setQuery: (patch: Partial<ProductQuery>) => void
  resetQuery: () => void
  goToPage: (page: number) => void
  reload: () => void
  adjustStock: (id: string, delta: number) => Promise<void>
  dismissAdjustmentError: () => void
}

/**
 * Owns everything the inventory screen needs: the query, the current page, the
 * summary tiles and optimistic stock edits.
 */
export function useInventory(): UseInventoryResult {
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQueryState] = useState<ProductQuery>(INITIAL_QUERY)
  const [page, setPage] = useState<ProductPage>(EMPTY_PAGE)
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [pendingAdjustmentId, setPendingAdjustmentId] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const debouncedSearch = useDebouncedValue(searchTerm, APP_CONFIG.searchDebounceMs)

  const effectiveQuery = useMemo<ProductQuery>(
    () => ({ ...query, search: debouncedSearch }),
    [query, debouncedSearch]
  )

  // Guards against an earlier, slower response overwriting a newer one.
  const requestSeq = useRef(0)

  useEffect(() => {
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    let active = true

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await listProducts(effectiveQuery)
        if (!active || requestSeq.current !== seq) {
          return
        }
        setPage(result)
      } catch (err) {
        if (!active || requestSeq.current !== seq) {
          return
        }
        setError(toUserMessage(err, 'We could not load the catalogue. Please try again.'))
        setPage(EMPTY_PAGE)
      } finally {
        if (active && requestSeq.current === seq) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [effectiveQuery, reloadToken])

  const setQuery = useCallback((patch: Partial<ProductQuery>) => {
    setQueryState((previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }))
  }, [])

  const resetQuery = useCallback(() => {
    setSearchTerm('')
    setQueryState(INITIAL_QUERY)
  }, [])

  const goToPage = useCallback((next: number) => {
    setQueryState((previous) => ({ ...previous, page: Math.max(1, next) }))
  }, [])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  /**
   * Optimistic stock edit. The row moves immediately, and if the repository
   * refuses — an oversell, a vanished SKU — the previous page and summary are
   * put back exactly as they were and the reason is surfaced inline.
   */
  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      setAdjustmentError(null)
      setPendingAdjustmentId(id)

      const previousPage = page
      const previousSummary = summary

      const optimisticItems = previousPage.items.map((product) =>
        product.id === id ? { ...product, stock: Math.max(0, product.stock + delta) } : product
      )
      setPage({ ...previousPage, items: optimisticItems })
      if (previousSummary) {
        setSummary(recomputeSummary(previousSummary, previousPage.items, optimisticItems))
      }

      try {
        const response = await requestStockAdjustment({ id, delta })
        setPage((current) => ({
          ...current,
          items: current.items.map((product) => (product.id === id ? response.data : product)),
        }))
      } catch (err) {
        setPage(previousPage)
        setSummary(previousSummary)
        setAdjustmentError(toUserMessage(err, 'The stock change could not be saved.'))
      } finally {
        setPendingAdjustmentId(null)
      }
    },
    [page, summary]
  )

  // The summary is derived from the full catalogue, not the visible page, so
  // it keeps counting SKUs that the current filter hides.
  useEffect(() => {
    let active = true
    listProducts({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })
      .then((all) => {
        if (active) {
          setSummary(summarizeInventory(all.items))
        }
      })
      .catch(() => {
        if (active) {
          setSummary(null)
        }
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  return {
    query: effectiveQuery,
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
    dismissAdjustmentError: () => setAdjustmentError(null),
  }
}

function recomputeSummary(
  summary: InventorySummary,
  before: Product[],
  after: Product[]
): InventorySummary {
  const beforeSlice = summarizeInventory(before)
  const afterSlice = summarizeInventory(after)

  return {
    skuCount: summary.skuCount,
    unitCount: summary.unitCount - beforeSlice.unitCount + afterSlice.unitCount,
    lowStockCount: summary.lowStockCount - beforeSlice.lowStockCount + afterSlice.lowStockCount,
    outOfStockCount:
      summary.outOfStockCount - beforeSlice.outOfStockCount + afterSlice.outOfStockCount,
    stockValue: summary.stockValue - beforeSlice.stockValue + afterSlice.stockValue,
  }
}
