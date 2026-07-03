export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Beauty',
  'Automotive',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  /** Units on hand. Always an integer — the data layer rejects anything else. */
  stock: number
  imageUrl?: string
  sku: string
  /** Percentage knocked off `price` while a SKU is on overstock clearance. */
  clearancePercent?: number
  createdAt: string
  updatedAt: string
}

export interface FilterOptions {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export const SORT_FIELDS = ['name', 'price', 'stock', 'updatedAt'] as const
export type SortField = (typeof SORT_FIELDS)[number]
export type SortDirection = 'asc' | 'desc'

/**
 * A full read request against the catalogue: filters, free-text search,
 * ordering and a page window. The same shape is understood by the repository
 * and by the URL query string, so a view is shareable.
 */
export interface ProductQuery extends FilterOptions {
  search?: string
  sortField?: SortField
  sortDirection?: SortDirection
  page?: number
  pageSize?: number
}

export interface InventorySummary {
  skuCount: number
  unitCount: number
  lowStockCount: number
  outOfStockCount: number
  /** Sum of price * stock across every SKU in the catalogue. */
  stockValue: number
}

export interface CreateProductRequest {
  name: string
  description: string
  category: string
  price: number
  stock: number
  imageUrl?: string
  sku: string
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

export interface AdjustStockRequest {
  id: string
  /** Signed change in units. Negative values ship stock out. */
  delta: number
}
