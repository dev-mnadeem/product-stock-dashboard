import { APP_CONFIG } from '@/config/app'
import { queryProducts, summarizeInventory, type ProductPage } from '@/domain/query'
import { ApiException } from '@/types/api'
import type {
  AdjustStockRequest,
  CreateProductRequest,
  InventorySummary,
  Product,
  ProductQuery,
  UpdateProductRequest,
} from '@/types/product'
import { mockProducts } from '@/data/mockProducts'

/**
 * The seam the rest of the app is written against. Everything above this
 * interface — hooks, pages, components — is unaware that the catalogue
 * currently lives in a module-scoped array, so swapping in an HTTP or SQL
 * adapter is a one-line change in `getProductRepository`.
 */
export interface ProductRepository {
  list(query?: ProductQuery): Promise<ProductPage>
  findAll(query?: ProductQuery): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  summary(): Promise<InventorySummary>
  create(input: CreateProductRequest): Promise<Product>
  update(input: UpdateProductRequest): Promise<Product>
  adjustStock(input: AdjustStockRequest): Promise<Product>
  remove(id: string): Promise<void>
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const clone = (product: Product): Product => ({ ...product })

const requireText = (value: string | undefined, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiException('VALIDATION_ERROR', `${field} is required`)
  }
  return value.trim()
}

const requireNumber = (value: number | undefined, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiException('VALIDATION_ERROR', `${field} must be a valid number`)
  }
  return value
}

const requirePrice = (value: number | undefined): number => {
  const price = requireNumber(value, 'Price')
  if (price <= 0 || price > APP_CONFIG.maxPrice) {
    throw new ApiException(
      'VALIDATION_ERROR',
      `Price must be between 0.01 and ${APP_CONFIG.maxPrice.toLocaleString(APP_CONFIG.locale)}`
    )
  }
  return price
}

const requireStock = (value: number | undefined): number => {
  const stock = requireNumber(value, 'Stock')
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiException('VALIDATION_ERROR', 'Stock must be a non-negative integer')
  }
  return stock
}

let counter = 0

const newId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  // Deterministic-length fallback for environments without WebCrypto.
  return `p-${Date.now().toString(36)}-${(counter += 1).toString(36)}`
}

/**
 * In-memory adapter. Reads hand out copies so a component that mutates a
 * product it was given cannot corrupt the store — the bug that makes
 * module-level fixture arrays leak state between screens.
 */
export class InMemoryProductRepository implements ProductRepository {
  private products: Product[]

  constructor(seed: readonly Product[] = mockProducts) {
    this.products = seed.map(clone)
  }

  /** Restores the catalogue to its seed. Used by tests to stay isolated. */
  reset(seed: readonly Product[] = mockProducts): void {
    this.products = seed.map(clone)
  }

  async list(query: ProductQuery = {}): Promise<ProductPage> {
    await delay(APP_CONFIG.latency.list)
    const page = queryProducts(this.products, query)
    return { ...page, items: page.items.map(clone) }
  }

  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    await delay(APP_CONFIG.latency.list)
    return queryProducts(this.products, {
      ...query,
      page: 1,
      pageSize: Number.MAX_SAFE_INTEGER,
    }).items.map(clone)
  }

  async findById(id: string): Promise<Product | null> {
    await delay(APP_CONFIG.latency.read)
    const product = this.products.find((candidate) => candidate.id === id)
    return product ? clone(product) : null
  }

  async summary(): Promise<InventorySummary> {
    await delay(APP_CONFIG.latency.read)
    return summarizeInventory(this.products)
  }

  async create(input: CreateProductRequest): Promise<Product> {
    await delay(APP_CONFIG.latency.write)

    const name = requireText(input.name, 'Product name')
    const description = requireText(input.description, 'Description')
    const category = requireText(input.category, 'Category')
    const sku = requireText(input.sku, 'SKU').toUpperCase()
    const price = requirePrice(input.price)
    const stock = requireStock(input.stock)

    if (this.products.some((product) => product.sku === sku)) {
      throw new ApiException('DUPLICATE_SKU', `SKU ${sku} is already in the catalogue`)
    }

    const now = new Date().toISOString()
    const product: Product = {
      id: newId(),
      name,
      description,
      category,
      price,
      stock,
      imageUrl: input.imageUrl?.trim() || undefined,
      sku,
      createdAt: now,
      updatedAt: now,
    }

    this.products.push(product)
    return clone(product)
  }

  async update(input: UpdateProductRequest): Promise<Product> {
    await delay(APP_CONFIG.latency.write)

    const index = this.indexOf(input.id)
    const current = this.products[index]

    // Only keys the caller actually sent are merged, so an explicit
    // `{ id, price: undefined }` cannot blank out a field.
    const next: Product = {
      ...current,
      ...(input.name !== undefined ? { name: requireText(input.name, 'Product name') } : {}),
      ...(input.description !== undefined
        ? { description: requireText(input.description, 'Description') }
        : {}),
      ...(input.category !== undefined
        ? { category: requireText(input.category, 'Category') }
        : {}),
      ...(input.sku !== undefined ? { sku: requireText(input.sku, 'SKU').toUpperCase() } : {}),
      ...(input.price !== undefined ? { price: requirePrice(input.price) } : {}),
      ...(input.stock !== undefined ? { stock: requireStock(input.stock) } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() || undefined } : {}),
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }

    if (next.sku !== current.sku && this.products.some((p) => p.sku === next.sku)) {
      throw new ApiException('DUPLICATE_SKU', `SKU ${next.sku} is already in the catalogue`)
    }

    this.products[index] = next
    return clone(next)
  }

  /**
   * Receiving and shipping stock. Rejecting an oversell here is what the
   * table's optimistic stepper has to roll back from.
   */
  async adjustStock({ id, delta }: AdjustStockRequest): Promise<Product> {
    await delay(APP_CONFIG.latency.write)

    if (!Number.isInteger(delta) || delta === 0) {
      throw new ApiException('VALIDATION_ERROR', 'Stock adjustment must be a non-zero integer')
    }

    if (Math.abs(delta) > APP_CONFIG.maxStockAdjustment) {
      throw new ApiException(
        'VALIDATION_ERROR',
        `Adjust by at most ${APP_CONFIG.maxStockAdjustment} units at a time`
      )
    }

    const index = this.indexOf(id)
    const current = this.products[index]
    const stock = current.stock + delta

    if (stock < 0) {
      throw new ApiException(
        'INSUFFICIENT_STOCK',
        `Only ${current.stock} units of ${current.sku} on hand`
      )
    }

    const next: Product = { ...current, stock, updatedAt: new Date().toISOString() }
    this.products[index] = next
    return clone(next)
  }

  async remove(id: string): Promise<void> {
    await delay(APP_CONFIG.latency.write)
    this.products.splice(this.indexOf(id), 1)
  }

  private indexOf(id: string): number {
    const index = this.products.findIndex((product) => product.id === id)
    if (index === -1) {
      throw new ApiException('NOT_FOUND', `No product with id ${id}`)
    }
    return index
  }
}

let repository: ProductRepository | null = null

/** Process-wide repository. Replace the constructor call to change backends. */
export function getProductRepository(): ProductRepository {
  if (!repository) {
    repository = new InMemoryProductRepository()
  }
  return repository
}

/** Test hook: point the app at a fixture repository. */
export function setProductRepository(next: ProductRepository | null): void {
  repository = next
}
