'use client'

import Image from 'next/image'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { StockBadge } from '@/components/StockBadge'
import { Button } from '@/components/ui/Button'
import { isOutOfStock } from '@/domain/stock'
import type { Product } from '@/types/product'
import { calculateDiscount, formatPrice, formatQuantity } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
}

/** Merchandising view of a single SKU, used by the grid layout. */
export function ProductCard({ product }: ProductCardProps) {
  const unavailable = isOutOfStock(product)
  const clearancePrice =
    product.clearancePercent && product.clearancePercent > 0
      ? calculateDiscount(product.price, product.clearancePercent)
      : null

  const handleAddToCart = () => {
    if (unavailable) {
      return
    }
    console.log('Add to cart:', product.id)
  }

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
          <h3 className="truncate text-base font-semibold text-secondary-900">
            {product.name}
          </h3>
          <StockBadge stock={product.stock} className="shrink-0" />
        </div>

        <p className="line-clamp-2 text-sm text-secondary-500">{product.description}</p>

        <dl className="flex items-center justify-between text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-secondary-400">Category</dt>
            <dd className="font-medium text-secondary-700">{product.category}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs uppercase tracking-wide text-secondary-400">Stock</dt>
            <dd className="tabular font-medium text-secondary-700">
              {formatQuantity(product.stock)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            {clearancePrice !== null ? (
              <>
                <span className="tabular text-lg font-bold text-error-600">
                  {formatPrice(clearancePrice)}
                </span>
                <span className="tabular text-sm text-secondary-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="tabular text-lg font-bold text-secondary-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-secondary-400">SKU: {product.sku}</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            disabled={unavailable}
            aria-disabled={unavailable}
            onClick={handleAddToCart}
          >
            {unavailable ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => console.log('View details:', product.id)}
            aria-label={`View details for ${product.name}`}
          >
            Details
          </Button>
        </div>
      </div>
    </article>
  )
}
