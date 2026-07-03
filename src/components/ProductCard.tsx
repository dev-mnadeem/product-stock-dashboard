'use client'

import Image from 'next/image'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { StockBadge } from '@/components/StockBadge'
import { StockStepper } from '@/components/StockStepper'
import type { Product } from '@/types/product'
import { calculateDiscount, formatPrice } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
  pending: boolean
  onAdjustStock: (id: string, delta: number) => void
}

/**
 * Grid view of a single SKU. It carries the same stepper as the table row, so
 * switching layouts never takes away the one write the screen offers.
 */
export function ProductCard({ product, pending, onAdjustStock }: ProductCardProps) {
  const clearancePrice =
    product.clearancePercent && product.clearancePercent > 0
      ? calculateDiscount(product.price, product.clearancePercent)
      : null

  return (
    <article className="surface flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.name} product image`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <CategoryGlyph category={product.category} size="lg" />
        )}
        {clearancePrice !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-error-500 px-2.5 py-1 text-xs font-semibold text-white">
            {product.clearancePercent}% off
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-secondary-900">
            {product.name}
          </h3>
          <StockBadge stock={product.stock} className="shrink-0" />
        </div>

        <p className="line-clamp-2 text-sm text-secondary-500">{product.description}</p>

        <dl className="flex items-center justify-between text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-secondary-500">Category</dt>
            <dd className="font-medium text-secondary-700">{product.category}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs uppercase tracking-wide text-secondary-500">SKU</dt>
            <dd className="font-mono text-xs text-secondary-600">{product.sku}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            {clearancePrice !== null ? (
              <>
                <span className="tabular text-lg font-bold text-error-600">
                  {formatPrice(clearancePrice)}
                </span>
                <span className="tabular text-sm text-secondary-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="tabular text-lg font-bold text-secondary-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <StockStepper product={product} pending={pending} onAdjust={onAdjustStock} />
        </div>
      </div>
    </article>
  )
}
