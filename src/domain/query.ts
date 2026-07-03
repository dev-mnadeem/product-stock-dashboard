import { APP_CONFIG } from '@/config/app'
import { classifyStock } from '@/domain/stock'
import type {
  InventorySummary,
  Product,
  ProductQuery,
  SortDirection,
  SortField,
} from '@/types/product'

export interface ProductPage {
  items: Product[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const normalizeNumber = (value?: number): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }
  return value
}

/**
 * Normalising here rather than at each call site means a blank search box, an
 * empty category select and a half-typed price all collapse to `undefined`
 * before any comparison runs.
 */
export function normalizeQuery(
  query: ProductQuery = {}
): Required<Pick<ProductQuery, 'page' | 'pageSize' | 'sortField' | 'sortDirection'>> &
  ProductQuery {
  return {
    ...query,
    search: query.search?.trim().toLowerCase() || undefined,
    category: query.category?.trim() || undefined,
    minPrice: normalizeNumber(query.minPrice),
    maxPrice: normalizeNumber(query.maxPrice),
    inStock: query.inStock,
    sortField: query.sortField ?? 'name',
    sortDirection: query.sortDirection ?? 'asc',
    page: Math.max(1, Math.trunc(query.page ?? 1)),
    pageSize: Math.max(1, Math.trunc(query.pageSize ?? APP_CONFIG.pageSize)),
  }
}

/**
 * The one predicate the whole app filters with. The listing page and the data
 * layer both call it, so a filter can never mean two different things.
 */
export function matchesQuery(product: Product, query: ProductQuery): boolean {
  const normalized = normalizeQuery(query)

  if (normalized.category && product.category !== normalized.category) {
    return false
  }

  if (normalized.minPrice !== undefined && product.price < normalized.minPrice) {
    return false
  }

  if (normalized.maxPrice !== undefined && product.price > normalized.maxPrice) {
    return false
  }

  if (normalized.inStock === true && classifyStock(product.stock) === 'out-of-stock') {
    return false
  }

  if (normalized.inStock === false && classifyStock(product.stock) !== 'out-of-stock') {
    return false
  }

  if (normalized.search) {
    const haystack =
      `${product.name} ${product.sku} ${product.description} ${product.category}`.toLowerCase()
    if (!haystack.includes(normalized.search)) {
      return false
    }
  }

  return true
}

const COMPARATORS: Record<SortField, (a: Product, b: Product) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, APP_CONFIG.locale),
  price: (a, b) => a.price - b.price,
  stock: (a, b) => a.stock - b.stock,
  updatedAt: (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
}

export function sortProducts(
  products: Product[],
  field: SortField = 'name',
  direction: SortDirection = 'asc'
): Product[] {
  const comparator = COMPARATORS[field] ?? COMPARATORS.name
  const factor = direction === 'desc' ? -1 : 1
  return [...products].sort((a, b) => comparator(a, b) * factor)
}

/** Filters, sorts and slices a catalogue into one page of results. */
export function queryProducts(products: Product[], query: ProductQuery = {}): ProductPage {
  const normalized = normalizeQuery(query)
  const matched = products.filter((product) => matchesQuery(product, normalized))
  const sorted = sortProducts(matched, normalized.sortField, normalized.sortDirection)

  const totalPages = Math.max(1, Math.ceil(sorted.length / normalized.pageSize))
  const page = Math.min(normalized.page, totalPages)
  const start = (page - 1) * normalized.pageSize

  return {
    items: sorted.slice(start, start + normalized.pageSize),
    totalCount: sorted.length,
    page,
    pageSize: normalized.pageSize,
    totalPages,
  }
}

export function summarizeInventory(products: Product[]): InventorySummary {
  return products.reduce<InventorySummary>(
    (summary, product) => {
      const status = classifyStock(product.stock)
      return {
        skuCount: summary.skuCount + 1,
        unitCount: summary.unitCount + Math.max(0, product.stock),
        lowStockCount: summary.lowStockCount + (status === 'low-stock' ? 1 : 0),
        outOfStockCount: summary.outOfStockCount + (status === 'out-of-stock' ? 1 : 0),
        stockValue: summary.stockValue + product.price * Math.max(0, product.stock),
      }
    },
    { skuCount: 0, unitCount: 0, lowStockCount: 0, outOfStockCount: 0, stockValue: 0 }
  )
}
