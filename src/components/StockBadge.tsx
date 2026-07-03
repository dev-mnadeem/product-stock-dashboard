import { describeStock, type StockStatus } from '@/domain/stock'

const TONE: Record<StockStatus, string> = {
  'out-of-stock': 'bg-error-50 text-error-700 ring-1 ring-inset ring-error-200',
  'low-stock': 'bg-warning-50 text-warning-800 ring-1 ring-inset ring-warning-200',
  'in-stock': 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200',
}

const DOT: Record<StockStatus, string> = {
  'out-of-stock': 'bg-error-500',
  'low-stock': 'bg-warning-500',
  'in-stock': 'bg-success-500',
}

interface StockBadgeProps {
  stock: number
  className?: string
}

/** The one place a stock number is turned into a coloured label. */
export function StockBadge({ stock, className = '' }: StockBadgeProps) {
  const { status, label, hint } = describeStock(stock)

  return (
    <span
      className={`pill ${TONE[status]} ${className}`.trim()}
      title={hint}
      aria-label={`Stock status: ${label}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {label}
    </span>
  )
}
