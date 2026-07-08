const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-800',
  'bg-error-100 text-error-700',
  'bg-secondary-200 text-secondary-700',
]

/** Stable per-category colour, so a row keeps the same swatch across renders. */
function paletteFor(category: string): string {
  let hash = 0
  for (let index = 0; index < category.length; index += 1) {
    hash = (hash * 31 + category.charCodeAt(index)) % 1_000_003
  }
  return PALETTE[hash % PALETTE.length]
}

interface CategoryGlyphProps {
  category: string
  size?: 'sm' | 'lg'
}

/**
 * A letter tile instead of a product photo. The catalogue ships no image URLs,
 * and an empty grey box for every row reads as a broken page.
 */
export function CategoryGlyph({ category, size = 'sm' }: CategoryGlyphProps) {
  const dimensions =
    size === 'lg' ? 'h-14 w-14 text-xl rounded-xl' : 'h-9 w-9 text-sm rounded-lg'

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center font-semibold ${dimensions} ${paletteFor(category)}`}
    >
      {category.charAt(0).toUpperCase()}
    </span>
  )
}
