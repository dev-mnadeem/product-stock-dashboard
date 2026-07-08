'use client'

import type { Product } from '@/types/product'
import { formatQuantity } from '@/utils/formatters'

interface StockStepperProps {
  product: Product
  pending: boolean
  onAdjust: (id: string, delta: number) => void
}

/**
 * Receive and ship one unit. The count next to the buttons is whatever the
 * page currently holds, which during a request is the optimistic value.
 */
export function StockStepper({ product, pending, onAdjust }: StockStepperProps) {
  const cannotShip = pending || product.stock <= 0

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className="h-7 w-7 rounded-md border border-secondary-200 text-secondary-600 transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onAdjust(product.id, -1)}
        disabled={cannotShip}
        aria-label={`Ship one unit of ${product.sku}`}
      >
        &minus;
      </button>
      <span
        className="tabular min-w-[3.5rem] text-right text-sm font-semibold text-secondary-900"
        aria-live="polite"
      >
        {formatQuantity(product.stock)}
      </span>
      <button
        type="button"
        className="h-7 w-7 rounded-md border border-secondary-200 text-secondary-600 transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onAdjust(product.id, 1)}
        disabled={pending}
        aria-label={`Receive one unit of ${product.sku}`}
      >
        +
      </button>
    </div>
  )
}
