import { APP_CONFIG } from '@/config/app'
import type { Product } from '@/types/product'

export type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock'

export interface StockStatusDescriptor {
  status: StockStatus
  label: string
  /** Short sentence a screen reader or tooltip can use. */
  hint: string
}

const DESCRIPTORS: Record<StockStatus, StockStatusDescriptor> = {
  'out-of-stock': {
    status: 'out-of-stock',
    label: 'Out of Stock',
    hint: 'No units on hand. Reorder before this SKU can be sold.',
  },
  'low-stock': {
    status: 'low-stock',
    label: 'Low Stock',
    hint: `At or below the reorder point of ${APP_CONFIG.lowStockThreshold} units.`,
  },
  'in-stock': {
    status: 'in-stock',
    label: 'In Stock',
    hint: 'Healthy cover above the reorder point.',
  },
}

/**
 * Single source of truth for what a stock number means. Components ask this
 * function instead of re-implementing `stock <= 5` comparisons locally.
 */
export function classifyStock(stock: number): StockStatus {
  if (!Number.isFinite(stock) || stock <= 0) {
    return 'out-of-stock'
  }
  if (stock <= APP_CONFIG.lowStockThreshold) {
    return 'low-stock'
  }
  return 'in-stock'
}

export function describeStock(stock: number): StockStatusDescriptor {
  return DESCRIPTORS[classifyStock(stock)]
}

export function isOutOfStock(product: Pick<Product, 'stock'>): boolean {
  return classifyStock(product.stock) === 'out-of-stock'
}

export function isLowStock(product: Pick<Product, 'stock'>): boolean {
  return classifyStock(product.stock) === 'low-stock'
}
