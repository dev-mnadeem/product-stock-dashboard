import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProductPage from '@/app/products/page'
import { ApiException } from '@/types/api'

jest.mock('@/lib/api', () => ({ createProduct: jest.fn() }))
jest.mock('@/hooks/useCategorySuggestions', () => ({
  useCategorySuggestions: () => ({ suggestions: [], provider: null, loading: false }),
}))

const api = jest.requireMock('@/lib/api') as { createProduct: jest.Mock }

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Product name'), 'Cork Yoga Mat')
  await user.type(screen.getByLabelText('Description'), 'Natural cork, non-slip')
  await user.selectOptions(screen.getByLabelText('Category'), 'Sports')
  await user.type(screen.getByLabelText('SKU'), 'cym-014')
  await user.type(screen.getByLabelText('Unit price (USD)'), '78')
  await user.type(screen.getByLabelText('Opening stock (units)'), '12')
}

beforeEach(() => jest.clearAllMocks())

describe('NewProductPage', () => {
  it('lists every missing field instead of submitting an empty form', async () => {
    const user = userEvent.setup()
    render(<NewProductPage />)

    await user.click(screen.getByRole('button', { name: 'Add to catalogue' }))

    expect(await screen.findByText('Product name is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('Pick a category')).toBeInTheDocument()
    expect(screen.getByText('Price must be a number')).toBeInTheDocument()
    expect(screen.getByText('Stock must be a number')).toBeInTheDocument()
    expect(api.createProduct).not.toHaveBeenCalled()
  })

  it('sends a valid product to the data layer and confirms it', async () => {
    api.createProduct.mockResolvedValue({
      success: true,
      data: { name: 'Cork Yoga Mat', sku: 'CYM-014' },
    })
    const user = userEvent.setup()
    render(<NewProductPage />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Add to catalogue' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cork Yoga Mat added as CYM-014.'
    )
    expect(api.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Cork Yoga Mat',
        category: 'Sports',
        price: 78,
        stock: 12,
        imageUrl: undefined,
      })
    )
  })

  it('refuses an image URL that is not http or https', async () => {
    const user = userEvent.setup()
    render(<NewProductPage />)

    await fillValidForm(user)
    await user.type(screen.getByLabelText(/Image URL/), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Add to catalogue' }))

    expect(
      await screen.findByText('Enter a full http(s) URL, or leave this blank')
    ).toBeInTheDocument()
    expect(api.createProduct).not.toHaveBeenCalled()
  })

  it('shows the data layer reason when the SKU is taken', async () => {
    api.createProduct.mockRejectedValue(
      new ApiException('DUPLICATE_SKU', 'SKU CYM-014 is already in the catalogue')
    )
    const user = userEvent.setup()
    render(<NewProductPage />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Add to catalogue' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'SKU CYM-014 is already in the catalogue'
      )
    )
  })
})
