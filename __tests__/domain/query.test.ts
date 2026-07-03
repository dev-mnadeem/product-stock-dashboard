import {
  matchesQuery,
  normalizeQuery,
  queryProducts,
  sortProducts,
  summarizeInventory,
} from '@/domain/query'
import type { Product } from '@/types/product'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'id-1',
  name: 'Cork Yoga Mat',
  description: 'Natural cork over recycled rubber',
  category: 'Sports',
  price: 78,
  stock: 12,
  sku: 'CYM-014',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  ...overrides,
})

describe('normalizeQuery', () => {
  it('collapses blank strings and non-finite numbers to undefined', () => {
    const normalized = normalizeQuery({
      search: '   ',
      category: '  ',
      minPrice: Number.NaN,
      maxPrice: Number.POSITIVE_INFINITY,
    })

    expect(normalized.search).toBeUndefined()
    expect(normalized.category).toBeUndefined()
    expect(normalized.minPrice).toBeUndefined()
    expect(normalized.maxPrice).toBeUndefined()
  })

  it('fills in defaults for sorting and paging', () => {
    const normalized = normalizeQuery()
    expect(normalized.sortField).toBe('name')
    expect(normalized.sortDirection).toBe('asc')
    expect(normalized.page).toBe(1)
  })
})

describe('matchesQuery', () => {
  it('includes products sitting exactly on a price bound', () => {
    expect(matchesQuery(product({ price: 50 }), { minPrice: 50, maxPrice: 50 })).toBe(true)
  })

  it('excludes out-of-stock rows when inStock is true', () => {
    expect(matchesQuery(product({ stock: 0 }), { inStock: true })).toBe(false)
    expect(matchesQuery(product({ stock: 1 }), { inStock: true })).toBe(true)
  })

  it('keeps only out-of-stock rows when inStock is false', () => {
    expect(matchesQuery(product({ stock: 0 }), { inStock: false })).toBe(true)
    expect(matchesQuery(product({ stock: 1 }), { inStock: false })).toBe(false)
  })

  it('searches the SKU as well as the name', () => {
    expect(matchesQuery(product(), { search: 'cym-014' })).toBe(true)
    expect(matchesQuery(product(), { search: 'headphones' })).toBe(false)
  })

  it('combines a category and a price bound', () => {
    expect(
      matchesQuery(product({ category: 'Sports', price: 78 }), {
        category: 'Sports',
        maxPrice: 50,
      })
    ).toBe(false)
  })
})

describe('sortProducts', () => {
  const catalogue = [
    product({ id: 'a', name: 'Zinc Tray', price: 10, stock: 90 }),
    product({ id: 'b', name: 'Anvil', price: 300, stock: 2 }),
    product({ id: 'c', name: 'Mallet', price: 45, stock: 40 }),
  ]

  it('orders by name ascending by default', () => {
    expect(sortProducts(catalogue).map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })

  it('orders by price descending when asked', () => {
    expect(sortProducts(catalogue, 'price', 'desc').map((item) => item.id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('does not mutate the array it was given', () => {
    const before = catalogue.map((item) => item.id)
    sortProducts(catalogue, 'stock', 'desc')
    expect(catalogue.map((item) => item.id)).toEqual(before)
  })
})

describe('queryProducts', () => {
  const catalogue = Array.from({ length: 9 }, (_, index) =>
    product({ id: `id-${index}`, name: `Item ${index}`, price: index * 10, stock: index })
  )

  it('slices the result into pages', () => {
    const page = queryProducts(catalogue, { page: 2, pageSize: 4 })
    expect(page.items).toHaveLength(4)
    expect(page.totalCount).toBe(9)
    expect(page.totalPages).toBe(3)
  })

  it('always reports at least one page for an empty result', () => {
    const page = queryProducts(catalogue, { search: 'nothing matches this' })
    expect(page.items).toHaveLength(0)
    expect(page.totalPages).toBe(1)
  })
})

describe('summarizeInventory', () => {
  it('adds up SKUs, units, stock states and value', () => {
    const summary = summarizeInventory([
      product({ id: '1', price: 10, stock: 0 }),
      product({ id: '2', price: 10, stock: 3 }),
      product({ id: '3', price: 10, stock: 50 }),
    ])

    expect(summary.skuCount).toBe(3)
    expect(summary.unitCount).toBe(53)
    expect(summary.outOfStockCount).toBe(1)
    expect(summary.lowStockCount).toBe(1)
    expect(summary.stockValue).toBe(530)
  })
})
