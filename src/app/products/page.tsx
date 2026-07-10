'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CategorySuggestions } from '@/components/CategorySuggestions'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/Button'
import { APP_CONFIG } from '@/config/app'
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions'
import { createProduct } from '@/lib/api'
import { toUserMessage } from '@/types/api'
import { PRODUCT_CATEGORIES, type CreateProductRequest } from '@/types/product'

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(100, 'Keep the name under 100 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Keep the description under 500 characters'),
  category: z.string().min(1, 'Pick a category'),
  price: z
    .number({ error: 'Price must be a number' })
    .min(0.01, 'Price must be greater than 0')
    .max(APP_CONFIG.maxPrice, 'Price is above the catalogue limit'),
  stock: z
    .number({ error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(20, 'Keep the SKU under 20 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'SKU may only contain letters, numbers and hyphens'),
  imageUrl: z
    .string()
    .url('Enter a full URL, or leave this blank')
    .optional()
    .or(z.literal('')),
})

type ProductFormData = z.infer<typeof productSchema>

type Feedback = { tone: 'success' | 'error'; message: string } | null

export default function NewProductPage() {
  const [feedback, setFeedback] = useState<Feedback>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', category: '', sku: '', imageUrl: '' },
  })

  const name = watch('name') ?? ''
  const description = watch('description') ?? ''
  const category = watch('category') ?? ''
  const { suggestions, loading: suggesting } = useCategorySuggestions(name, description)

  const onSubmit = async (data: ProductFormData) => {
    setFeedback(null)

    const payload: CreateProductRequest = {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      stock: data.stock,
      sku: data.sku,
      imageUrl: data.imageUrl || undefined,
    }

    try {
      const response = await createProduct(payload)
      setFeedback({
        tone: 'success',
        message: `${response.data.name} added as ${response.data.sku}.`,
      })
      reset()
    } catch (error) {
      // ApiException carries a sentence written for a user. Anything else is a
      // bug, and is reported as a generic line rather than a raw stack.
      setFeedback({
        tone: 'error',
        message: toUserMessage(error, 'We could not save this product. Please try again.'),
      })
    }
  }

  const fieldClass = (invalid: boolean) =>
    `field-input ${invalid ? 'field-input-invalid' : ''}`.trim()

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-900">
            Add a product
          </h1>
          <p className="mt-1 text-sm text-secondary-500">
            New SKUs join the catalogue immediately and appear in the inventory table.
          </p>
        </div>

        {feedback && (
          <div
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm animate-fade-in ${
              feedback.tone === 'error'
                ? 'border-error-200 bg-error-50 text-error-800'
                : 'border-success-200 bg-success-50 text-success-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="surface space-y-5 p-6" noValidate>
          <div>
            <label htmlFor="name" className="field-label mb-1">
              Product name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Cork yoga mat"
              className={fieldClass(Boolean(errors.name))}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="field-label mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="What it is, what it is made of, who it is for."
              className={fieldClass(Boolean(errors.description))}
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="field-label mb-1">
                Category
              </label>
              <select
                id="category"
                className={fieldClass(Boolean(errors.category))}
                aria-invalid={Boolean(errors.category)}
                {...register('category')}
              >
                <option value="">Select a category</option>
                {PRODUCT_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-error-600">{errors.category.message}</p>
              )}
              <CategorySuggestions
                suggestions={suggestions}
                loading={suggesting}
                selected={category}
                onSelect={(value) =>
                  setValue('category', value, { shouldValidate: true, shouldDirty: true })
                }
              />
            </div>

            <div>
              <label htmlFor="sku" className="field-label mb-1">
                SKU
              </label>
              <input
                id="sku"
                type="text"
                placeholder="CYM-014"
                className={`${fieldClass(Boolean(errors.sku))} font-mono uppercase`}
                aria-invalid={Boolean(errors.sku)}
                {...register('sku')}
              />
              {errors.sku && (
                <p className="mt-1 text-sm text-error-600">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="field-label mb-1">
                Unit price (USD)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`${fieldClass(Boolean(errors.price))} tabular`}
                aria-invalid={Boolean(errors.price)}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-error-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="stock" className="field-label mb-1">
                Opening stock (units)
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className={`${fieldClass(Boolean(errors.stock))} tabular`}
                aria-invalid={Boolean(errors.stock)}
                {...register('stock', { valueAsNumber: true })}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-error-600">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className="field-label mb-1">
              Image URL <span className="normal-case text-secondary-400">(optional)</span>
            </label>
            <input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              className={fieldClass(Boolean(errors.imageUrl))}
              aria-invalid={Boolean(errors.imageUrl)}
              {...register('imageUrl')}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-error-600">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-secondary-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setFeedback(null)
              }}
            >
              Reset form
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add to catalogue'}
            </Button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  )
}
