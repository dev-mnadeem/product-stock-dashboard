import { fireEvent, render, screen, within } from '@testing-library/react'
import { ProductTable } from '@/components/ProductTable'
import type { Product } from '@/types/product'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p-1',
  name: 'Merino Wool Socks',
  description: 'Cushioned merino crew socks that stay warm when damp.',
  category: 'Clothing',
  price: 24.5,
  stock: 1240,
  sku: 'MWS-006',
  createdAt: '2024-01-22T09:00:00Z',
  updatedAt: '2024-03-04T11:10:00Z',
  ...overrides,
})

const renderTable = (products: Product[], pendingAdjustmentId: string | null = null) => {
  const onAdjustStock = jest.fn()
  render(
    <ProductTable
      products={products}
      pendingAdjustmentId={pendingAdjustmentId}
      onAdjustStock={onAdjustStock}
    />
  )
  return { onAdjustStock }
}

describe('ProductTable', () => {
  it('groups quantities with the configured locale', () => {
    renderTable([product()])
    expect(screen.getByText('1,240')).toBeInTheDocument()
  })

  it('renders a row per SKU with its price and category', () => {
    renderTable([product(), product({ id: 'p-2', sku: 'CYM-014', name: 'Cork Yoga Mat' })])

    expect(screen.getAllByRole('row')).toHaveLength(3) // header + two rows
    expect(screen.getByText('MWS-006')).toBeInTheDocument()
    expect(screen.getAllByText('$24.50')).toHaveLength(2)
  })

  it('shows the stock state as a labelled badge', () => {
    renderTable([
      product({ id: 'a', sku: 'A-1', stock: 0 }),
      product({ id: 'b', sku: 'B-1', stock: 2 }),
      product({ id: 'c', sku: 'C-1', stock: 90 }),
    ])

    expect(screen.getByLabelText('Stock status: Out of Stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Stock status: Low Stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Stock status: In Stock')).toBeInTheDocument()
  })

  it('reports a receive as a positive delta', () => {
    const { onAdjustStock } = renderTable([product()])

    fireEvent.click(screen.getByRole('button', { name: /receive one unit of MWS-006/i }))
    expect(onAdjustStock).toHaveBeenCalledWith('p-1', 1)
  })

  it('reports a ship as a negative delta', () => {
    const { onAdjustStock } = renderTable([product()])

    fireEvent.click(screen.getByRole('button', { name: /ship one unit of MWS-006/i }))
    expect(onAdjustStock).toHaveBeenCalledWith('p-1', -1)
  })

  it('cannot ship a SKU that is already at zero', () => {
    renderTable([product({ stock: 0 })])
    expect(screen.getByRole('button', { name: /ship one unit/i })).toBeDisabled()
  })

  it('locks both steppers while an adjustment is in flight', () => {
    renderTable([product()], 'p-1')

    expect(screen.getByRole('button', { name: /receive one unit/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /ship one unit/i })).toBeDisabled()
  })

  it('shows the clearance price beside the struck-through list price', () => {
    renderTable([product({ clearancePercent: 15 })])

    const row = screen.getAllByRole('row')[1]
    expect(within(row).getByText('$20.82')).toBeInTheDocument()
    expect(within(row).getByText('$24.50')).toBeInTheDocument()
  })
})
