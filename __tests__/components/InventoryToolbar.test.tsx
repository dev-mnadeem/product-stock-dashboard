import { fireEvent, render, screen } from '@testing-library/react'
import { InventoryToolbar } from '@/components/InventoryToolbar'

const setup = (overrides: Partial<Parameters<typeof InventoryToolbar>[0]> = {}) => {
  const props = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    sortField: 'name' as const,
    sortDirection: 'asc' as const,
    onSortChange: jest.fn(),
    view: 'table' as const,
    onViewChange: jest.fn(),
    ...overrides,
  }
  render(<InventoryToolbar {...props} />)
  return props
}

describe('InventoryToolbar', () => {
  it('reports every keystroke in the search box', () => {
    const { onSearchChange } = setup()

    fireEvent.change(screen.getByLabelText(/search catalogue/i), {
      target: { value: 'cork' },
    })
    expect(onSearchChange).toHaveBeenCalledWith('cork')
  })

  it('changes the sort field while keeping the direction', () => {
    const { onSortChange } = setup({ sortDirection: 'desc' })

    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'stock' } })
    expect(onSortChange).toHaveBeenCalledWith('stock', 'desc')
  })

  it('flips the direction without changing the field', () => {
    const { onSortChange } = setup({ sortField: 'price' })

    fireEvent.click(screen.getByRole('button', { name: /sort descending/i }))
    expect(onSortChange).toHaveBeenCalledWith('price', 'desc')
  })

  it('marks the active layout with aria-pressed', () => {
    setup({ view: 'grid' })

    expect(screen.getByRole('button', { name: 'grid' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'table' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('switches layout when the other option is chosen', () => {
    const { onViewChange } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'grid' }))
    expect(onViewChange).toHaveBeenCalledWith('grid')
  })
})
