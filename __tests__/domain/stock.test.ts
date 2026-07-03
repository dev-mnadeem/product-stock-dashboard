import { APP_CONFIG } from '@/config/app'
import { classifyStock, describeStock, isLowStock, isOutOfStock } from '@/domain/stock'

describe('stock classification', () => {
  it('treats zero and negative counts as out of stock', () => {
    expect(classifyStock(0)).toBe('out-of-stock')
    expect(classifyStock(-4)).toBe('out-of-stock')
  })

  it('flags anything at or under the reorder point as low stock', () => {
    expect(classifyStock(1)).toBe('low-stock')
    expect(classifyStock(APP_CONFIG.lowStockThreshold)).toBe('low-stock')
  })

  it('treats one unit above the reorder point as healthy', () => {
    expect(classifyStock(APP_CONFIG.lowStockThreshold + 1)).toBe('in-stock')
  })

  it('does not crash on a non-finite count', () => {
    expect(classifyStock(Number.NaN)).toBe('out-of-stock')
    expect(classifyStock(Number.POSITIVE_INFINITY)).toBe('out-of-stock')
  })

  it('exposes a label and a hint for each state', () => {
    expect(describeStock(0).label).toBe('Out of Stock')
    expect(describeStock(2).label).toBe('Low Stock')
    expect(describeStock(500).label).toBe('In Stock')
    expect(describeStock(2).hint).toContain(String(APP_CONFIG.lowStockThreshold))
  })

  it('offers predicates for the two states callers branch on', () => {
    expect(isOutOfStock({ stock: 0 })).toBe(true)
    expect(isLowStock({ stock: 3 })).toBe(true)
    expect(isLowStock({ stock: 0 })).toBe(false)
  })
})
