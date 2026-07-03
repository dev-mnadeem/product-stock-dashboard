import { act, renderHook, waitFor } from '@testing-library/react'
import { useInventory } from '@/hooks/useInventory'
import { ApiException } from '@/types/api'
import type { Product } from '@/types/product'

jest.mock('@/lib/api', () => ({
  listProducts: jest.fn(),
  adjustStock: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const api = jest.requireMock('@/lib/api') as {
  listProducts: jest.Mock
  adjustStock: jest.Mock
}

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p-1',
  name: 'Cork Yoga Mat',
  description: 'Non-slip',
  category: 'Sports',
  price: 78,
  stock: 10,
  sku: 'CYM-014',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  ...overrides,
})

const pageOf = (items: Product[]) => ({
  items,
  totalCount: items.length,
  page: 1,
  pageSize: 8,
  totalPages: 1,
})

beforeEach(() => {
  jest.clearAllMocks()
  api.listProducts.mockResolvedValue(pageOf([product()]))
})

describe('useInventory', () => {
  it('loads the first page and derives the summary', async () => {
    const { result } = renderHook(() => useInventory())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.page.items).toHaveLength(1)
    await waitFor(() => expect(result.current.summary).not.toBeNull())
    expect(result.current.summary?.unitCount).toBe(10)
  })

  it('keeps a successful stock adjustment', async () => {
    api.adjustStock.mockResolvedValue({ success: true, data: product({ stock: 11 }) })

    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.adjustStock('p-1', 1)
    })

    expect(result.current.page.items[0].stock).toBe(11)
    expect(result.current.adjustmentError).toBeNull()
  })

  it('rolls the row back and explains why when the write is refused', async () => {
    api.adjustStock.mockRejectedValue(
      new ApiException('INSUFFICIENT_STOCK', 'Only 10 units of CYM-014 on hand')
    )

    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.adjustStock('p-1', -50)
    })

    expect(result.current.page.items[0].stock).toBe(10)
    expect(result.current.adjustmentError).toBe('Only 10 units of CYM-014 on hand')
  })

  it('restores the summary alongside the row it rolled back', async () => {
    api.adjustStock.mockRejectedValue(new ApiException('NOT_FOUND', 'gone'))

    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.summary).not.toBeNull())

    const before = result.current.summary

    await act(async () => {
      await result.current.adjustStock('p-1', 5)
    })

    expect(result.current.summary).toEqual(before)
  })

  it('surfaces a friendly message when the catalogue cannot be read', async () => {
    api.listProducts.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useInventory())

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error).toBe('We could not load the catalogue. Please try again.')
    expect(result.current.page.items).toHaveLength(0)
  })

  it('clears search and filters when the query is reset', async () => {
    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSearchTerm('mat')
      result.current.setQuery({ category: 'Sports' })
    })

    await waitFor(() => expect(result.current.query.category).toBe('Sports'))

    act(() => result.current.resetQuery())

    await waitFor(() => expect(result.current.query.category).toBeUndefined())
    expect(result.current.searchTerm).toBe('')
  })

  it('debounces typing into a single catalogue read', async () => {
    const { result } = renderHook(() => useInventory())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const callsAfterLoad = api.listProducts.mock.calls.length

    act(() => {
      result.current.setSearchTerm('c')
      result.current.setSearchTerm('co')
      result.current.setSearchTerm('cor')
      result.current.setSearchTerm('cork')
    })

    await waitFor(() =>
      expect(api.listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'cork' })
      )
    )

    expect(api.listProducts.mock.calls.length - callsAfterLoad).toBeLessThanOrEqual(2)
  })
})
