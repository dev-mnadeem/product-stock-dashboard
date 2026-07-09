import { render, screen, fireEvent } from '@testing-library/react'
import { ProductFilters } from '@/components/ProductFilters'
import type { FilterOptions } from '@/types/product'

describe('ProductFilters', () => {
  const mockFilters: FilterOptions = {
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
  }

  it('renders all filter controls', () => {
    const mockOnChange = jest.fn()
    render(<ProductFilters filters={mockFilters} onFiltersChange={mockOnChange} />)

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/min price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/availability/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /reset all product filters/i })
    ).toBeInTheDocument()
  })

  it('updates category filter', () => {
    const mockOnChange = jest.fn()
    render(<ProductFilters filters={mockFilters} onFiltersChange={mockOnChange} />)

    const categorySelect = screen.getByLabelText(/category/i)
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } })

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('updates price filters', () => {
    const mockOnChange = jest.fn()
    render(<ProductFilters filters={mockFilters} onFiltersChange={mockOnChange} />)

    const minPriceInput = screen.getByLabelText(/min price/i)
    fireEvent.change(minPriceInput, { target: { value: '50' } })

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('resets all filters when reset button is clicked', () => {
    const mockOnChange = jest.fn()
    const filtersWithValues: FilterOptions = {
      category: 'Electronics',
      minPrice: 50,
      maxPrice: 100,
      inStock: true,
    }

    render(<ProductFilters filters={filtersWithValues} onFiltersChange={mockOnChange} />)

    const resetButton = screen.getByRole('button', { name: /reset all product filters/i })
    fireEvent.click(resetButton)

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('handles empty string in price inputs', () => {
    const mockOnChange = jest.fn()
    const filtersWithPrice: FilterOptions = {
      category: '',
      minPrice: 50,
      maxPrice: undefined,
      inStock: undefined,
    }

    render(<ProductFilters filters={filtersWithPrice} onFiltersChange={mockOnChange} />)

    const minPriceInput = screen.getByLabelText(/min price/i) as HTMLInputElement
    expect(minPriceInput.value).toBe('50')

    fireEvent.change(minPriceInput, { target: { value: '' } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('displays filter summary when filters are active', () => {
    const filtersWithValues: FilterOptions = {
      category: 'Electronics',
      minPrice: 50,
      maxPrice: 200,
      inStock: true,
    }

    const mockOnChange = jest.fn()
    render(<ProductFilters filters={filtersWithValues} onFiltersChange={mockOnChange} />)

    const summary = screen.getByText(/category: electronics/i)
    expect(summary).toBeInTheDocument()
    expect(summary.textContent).toMatch(/category: electronics/i)
    expect(summary.textContent).toMatch(/min: \$50/i)
    expect(summary.textContent).toMatch(/max: \$200/i)
    expect(summary.textContent).toMatch(/in stock/i)
  })
})
