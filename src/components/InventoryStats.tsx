import type { InventorySummary } from '@/types/product'
import { formatCompactPrice, formatQuantity } from '@/utils/formatters'

interface InventoryStatsProps {
  summary: InventorySummary | null
}

const TILE = 'surface px-4 py-3'

/**
 * Catalogue-wide figures. They are deliberately computed from the whole
 * catalogue rather than the visible page, so filtering the table does not make
 * the business look smaller than it is.
 */
export function InventoryStats({ summary }: InventoryStatsProps) {
  const tiles = [
    {
      label: 'SKUs',
      value: summary ? formatQuantity(summary.skuCount) : '—',
      tone: 'text-secondary-900',
    },
    {
      label: 'Units on hand',
      value: summary ? formatQuantity(summary.unitCount) : '—',
      tone: 'text-secondary-900',
    },
    {
      label: 'Low stock',
      value: summary ? formatQuantity(summary.lowStockCount) : '—',
      tone: 'text-warning-700',
    },
    {
      label: 'Out of stock',
      value: summary ? formatQuantity(summary.outOfStockCount) : '—',
      tone: 'text-error-700',
    },
    {
      label: 'Stock value',
      value: summary ? formatCompactPrice(summary.stockValue) : '—',
      tone: 'text-primary-700',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div key={tile.label} className={TILE}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
            {tile.label}
          </dt>
          <dd className={`tabular mt-1 text-2xl font-semibold ${tile.tone}`}>{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
