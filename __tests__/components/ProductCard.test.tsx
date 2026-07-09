import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/types/product'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'This is a test product description',
  category: 'Electronics',
  price: 99.99,
  stock: 10,
  imageUrl: 'https://example.com/image.jpg',
  sku: 'TEST-001',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const outOfStockProduct: Product = {
  ...mockProduct,
  id: '2',
  stock: 0,
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('This is a test product description')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('SKU: TEST-001')).toBeInTheDocument()
  })

  it('displays correct stock status', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })

  it('shows out of stock status and disables button', () => {
    render(<ProductCard product={outOfStockProduct} />)

    // Check for stock status badge
    const stockStatus = screen.getByLabelText(/stock status: out of stock/i)
    expect(stockStatus).toBeInTheDocument()

    // Check for disabled button
    const addToCartButton = screen.getByRole('button', { name: /out of stock/i })
    expect(addToCartButton).toBeDisabled()
    expect(addToCartButton).toHaveAttribute('aria-disabled', 'true')
  })

  it('handles add to cart click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(<ProductCard product={mockProduct} />)

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addToCartButton)

    expect(consoleSpy).toHaveBeenCalledWith('Add to cart:', '1')

    consoleSpy.mockRestore()
  })

  it('handles details button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(<ProductCard product={mockProduct} />)

    const detailsButton = screen.getByRole('button', { name: /details/i })
    fireEvent.click(detailsButton)

    expect(consoleSpy).toHaveBeenCalledWith('View details:', '1')

    consoleSpy.mockRestore()
  })

  it('shows low stock warning for products with stock <= 5', () => {
    const lowStockProduct = { ...mockProduct, stock: 3 }
    render(<ProductCard product={lowStockProduct} />)

    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })
})
