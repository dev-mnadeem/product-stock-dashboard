'use client'

import { StockBadge } from '@/components/StockBadge'
import { StockStepper } from '@/components/StockStepper'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import type { Product } from '@/types/product'
import { calculateDiscount, formatDate, formatPrice, truncateText } from '@/utils/formatters'

interface ProductTableProps {
  products: Product[]
  pendingAdjustmentId: string | null
  onAdjustStock: (id: string, delta: number) => void
}

const HEAD_CELL =
  'whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500'

/** The default inventory view: one row per SKU, editable on the spot. */
export function ProductTable({
  products,
  pendingAdjustmentId,
  onAdjustStock,
}: ProductTableProps) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <caption className="sr-only">
            Product inventory with stock status and per-unit adjustment controls
          </caption>
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className={`${HEAD_CELL} w-2/5`}>
                Product
              </th>
              <th scope="col" className={HEAD_CELL}>
                SKU
              </th>
              <th scope="col" className={HEAD_CELL}>
                Category
              </th>
              <th scope="col" className={`${HEAD_CELL} text-right`}>
                Unit price
              </th>
              <th scope="col" className={HEAD_CELL}>
                Status
              </th>
              <th scope="col" className={`${HEAD_CELL} text-right`}>
                On hand
              </th>
              <th scope="col" className={HEAD_CELL}>
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 bg-white">
            {products.map((product) => {
              const clearancePrice =
                product.clearancePercent && product.clearancePercent > 0
                  ? calculateDiscount(product.price, product.clearancePercent)
                  : null

              return (
                <tr key={product.id} className="transition-colors hover:bg-secondary-50">
                  <td className="max-w-0 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <CategoryGlyph category={product.category} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-secondary-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-secondary-500">
                          {truncateText(product.description, 64)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-secondary-500">
                    {product.sku}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-secondary-700">
                    {product.category}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    {clearancePrice !== null ? (
                      <span className="flex flex-col items-end">
                        <span className="tabular text-sm font-semibold text-error-600">
                          {formatPrice(clearancePrice)}
                        </span>
                        <span className="tabular text-xs text-secondary-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      </span>
                    ) : (
                      <span className="tabular text-sm font-semibold text-secondary-900">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <StockStepper
                      product={product}
                      pending={pendingAdjustmentId === product.id}
                      onAdjust={onAdjustStock}
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-secondary-500">
                    {formatDate(product.updatedAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
