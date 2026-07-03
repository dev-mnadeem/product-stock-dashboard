import type { ProductPage } from '@/domain/query'
import { getProductRepository } from '@/lib/repository'
import type { ApiResponse } from '@/types/api'
import type {
  AdjustStockRequest,
  CreateProductRequest,
  FilterOptions,
  InventorySummary,
  Product,
  ProductQuery,
  UpdateProductRequest,
} from '@/types/product'

/**
 * Thin facade over the repository. Components import from here and never touch
 * an adapter directly, which keeps the swap in `getProductRepository` invisible
 * to the UI.
 */

/** One page of the catalogue, filtered, searched and sorted. */
export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  return getProductRepository().list(query)
}

/** Every match for a query, unpaged. Convenient for exports and tests. */
export async function getProducts(filters?: FilterOptions): Promise<Product[]> {
  return getProductRepository().findAll(filters ?? {})
}

export async function getProduct(id: string): Promise<Product | null> {
  return getProductRepository().findById(id)
}

export async function getInventorySummary(): Promise<InventorySummary> {
  return getProductRepository().summary()
}

export async function createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
  const product = await getProductRepository().create(data)
  return { success: true, data: product, message: 'Product created successfully' }
}

export async function updateProduct(data: UpdateProductRequest): Promise<ApiResponse<Product>> {
  const product = await getProductRepository().update(data)
  return { success: true, data: product, message: 'Product updated successfully' }
}

export async function adjustStock(data: AdjustStockRequest): Promise<ApiResponse<Product>> {
  const product = await getProductRepository().adjustStock(data)
  return { success: true, data: product, message: 'Stock level updated' }
}

export async function deleteProduct(id: string): Promise<ApiResponse<void>> {
  await getProductRepository().remove(id)
  return { success: true, data: undefined, message: 'Product deleted successfully' }
}
