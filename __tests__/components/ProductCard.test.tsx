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

const renderCard = (product: Product = mockProduct, pending = false) => {
  const onAdjustStock = jest.fn()
  render(<ProductCard product={product} pending={pending} onAdjustStock={onAdjustStock} />)
  return { onAdjustStock }
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderCard()

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('This is a test product description')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('TEST-001')).toBeInTheDocument()
  })

  it('displays correct stock status', () => {
    renderCard()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })

  it('shows low stock warning for products with stock <= 5', () => {
    renderCard({ ...mockProduct, stock: 3 })
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('receives and ships a unit through the same callback as the table', () => {
    const { onAdjustStock } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Receive one unit of TEST-001' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ship one unit of TEST-001' }))

    expect(onAdjustStock).toHaveBeenNthCalledWith(1, '1', 1)
    expect(onAdjustStock).toHaveBeenNthCalledWith(2, '1', -1)
  })

  it('cannot ship from an out-of-stock SKU', () => {
    renderCard({ ...mockProduct, stock: 0 })

    expect(screen.getByLabelText(/stock status: out of stock/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ship one unit of TEST-001' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Receive one unit of TEST-001' })).toBeEnabled()
  })

  it('locks the stepper while a write for this SKU is pending', () => {
    renderCard(mockProduct, true)

    expect(screen.getByRole('button', { name: 'Receive one unit of TEST-001' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ship one unit of TEST-001' })).toBeDisabled()
  })
})
