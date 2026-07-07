import { APP_CONFIG } from '@/config/app'

const currencyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: 'currency',
  currency: APP_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: 'currency',
  currency: APP_CONFIG.currency,
  notation: 'compact',
  maximumFractionDigits: 1,
})

const quantityFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  maximumFractionDigits: 0,
})

const isUsableNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function formatPrice(price: number): string {
  return currencyFormatter.format(isUsableNumber(price) ? price : 0)
}

/** Currency for headline figures, e.g. total stock value in a summary tile. */
export function formatCompactPrice(price: number): string {
  return compactCurrencyFormatter.format(isUsableNumber(price) ? price : 0)
}

/**
 * Unit counts go through Intl too. Rendering `{product.stock}` directly is how
 * a four-digit quantity ends up on screen as "1240" instead of "1,240".
 */
export function formatQuantity(quantity: number): string {
  return quantityFormatter.format(isUsableNumber(quantity) ? Math.trunc(quantity) : 0)
}

export function formatDate(dateString: string): string {
  if (!dateString) {
    return 'Invalid date'
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString(APP_CONFIG.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) {
    return ''
  }

  if (maxLength <= 0) {
    return '...'
  }

  if (text.length <= maxLength) {
    return text
  }

  return `${text.substring(0, maxLength)}...`
}

export function calculateDiscount(originalPrice: number, discountPercent: number): number {
  const safePrice = isUsableNumber(originalPrice) ? originalPrice : 0
  const safePercent = isUsableNumber(discountPercent) ? discountPercent : 0
  const normalizedDiscount = Math.min(Math.max(safePercent, 0), 100)

  return Number.parseFloat((safePrice * (1 - normalizedDiscount / 100)).toFixed(2))
}
