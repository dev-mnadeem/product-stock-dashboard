import {
  calculateDiscount,
  formatCompactPrice,
  formatDate,
  formatPrice,
  formatQuantity,
  truncateText,
} from '@/utils/formatters'

describe('Formatter Utilities', () => {
  describe('formatPrice', () => {
    it('formats regular prices correctly', () => {
      expect(formatPrice(99.99)).toBe('$99.99')
      expect(formatPrice(10)).toBe('$10.00')
      expect(formatPrice(0)).toBe('$0.00')
    })

    it('falls back to zero rather than throwing on a non-finite price', () => {
      expect(formatPrice(NaN)).toBe('$0.00')
      expect(formatPrice(Infinity)).toBe('$0.00')
    })
  })

  describe('formatQuantity', () => {
    it('groups thousands for the configured locale', () => {
      expect(formatQuantity(1240)).toBe('1,240')
      expect(formatQuantity(860)).toBe('860')
    })

    it('drops a fractional unit count rather than rendering it', () => {
      expect(formatQuantity(12.7)).toBe('12')
    })

    it('falls back to zero for a non-finite count', () => {
      expect(formatQuantity(Number.NaN)).toBe('0')
    })
  })

  describe('formatCompactPrice', () => {
    it('shortens a headline figure', () => {
      expect(formatCompactPrice(125_400)).toBe('$125.4K')
    })
  })

  describe('formatDate', () => {
    it('formats valid dates correctly', () => {
      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('handles invalid dates gracefully', () => {
      expect(() => formatDate('invalid-date')).not.toThrow()
    })
  })

  describe('truncateText', () => {
    it('truncates long text correctly', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 10)).toBe('This is a ...')
    })

    it('returns short text unchanged', () => {
      expect(truncateText('Short', 10)).toBe('Short')
    })

    it('handles edge cases', () => {
      expect(() => truncateText('', 5)).not.toThrow()
      expect(() => truncateText('test', -1)).not.toThrow()
    })
  })

  describe('calculateDiscount', () => {
    it('calculates discount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(90)
      expect(calculateDiscount(50, 20)).toBe(40)
    })

    it('clamps a discount outside 0-100 percent', () => {
      expect(calculateDiscount(100, -10)).toBe(100)
      expect(calculateDiscount(100, 150)).toBe(0)
    })

    it('treats a non-finite input as zero instead of throwing', () => {
      expect(calculateDiscount(Number.NaN, 10)).toBe(0)
      expect(calculateDiscount(100, Number.NaN)).toBe(100)
    })
  })
})
