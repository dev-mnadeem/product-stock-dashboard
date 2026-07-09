import { fireEvent, render, screen } from '@testing-library/react'
import { Pagination } from '@/components/Pagination'

describe('Pagination', () => {
  it('describes the window currently on screen', () => {
    render(
      <Pagination
        page={2}
        totalPages={3}
        totalCount={24}
        pageSize={8}
        onPageChange={jest.fn()}
      />
    )

    const nav = screen.getByRole('navigation', { name: /inventory pagination/i })
    expect(nav.textContent).toContain('9')
    expect(nav.textContent).toContain('16')
    expect(nav.textContent).toContain('24')
  })

  it('disables Previous on the first page', () => {
    render(
      <Pagination
        page={1}
        totalPages={3}
        totalCount={24}
        pageSize={8}
        onPageChange={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('disables Next on the last page', () => {
    render(
      <Pagination
        page={3}
        totalPages={3}
        totalCount={24}
        pageSize={8}
        onPageChange={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('asks for the neighbouring page when a control is used', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination
        page={2}
        totalPages={3}
        totalCount={24}
        pageSize={8}
        onPageChange={onPageChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('shows a zero-based window when nothing matched', () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        totalCount={0}
        pageSize={8}
        onPageChange={jest.fn()}
      />
    )
    expect(screen.getByRole('navigation').textContent).toContain('0')
  })
})
