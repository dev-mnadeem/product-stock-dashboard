import {
  adjustStock,
  createProduct,
  deleteProduct,
  getInventorySummary,
  getProduct,
  getProducts,
  listProducts,
  updateProduct,
} from '@/lib/api'
import { InMemoryProductRepository, setProductRepository } from '@/lib/repository'
import { mockProducts } from '@/data/mockProducts'
import { ApiException } from '@/types/api'
import type { CreateProductRequest, FilterOptions } from '@/types/product'

// Each test starts from the seed catalogue. Without this the module-scoped
// repository would carry writes from one test into the next.
beforeEach(() => {
  setProductRepository(new InMemoryProductRepository())
})

afterAll(() => {
  setProductRepository(null)
})

describe('API Functions', () => {
  describe('getProducts', () => {
    it('returns all products when no filters applied', async () => {
      const products = await getProducts()
      expect(products).toHaveLength(mockProducts.length)
      expect(products[0]).toHaveProperty('id')
      expect(products[0]).toHaveProperty('name')
    })

    it('filters products by category', async () => {
      const filters: FilterOptions = { category: 'Electronics' }
      const products = await getProducts(filters)

      expect(products.length).toBeGreaterThan(0)
      products.forEach((product) => {
        expect(product.category).toBe('Electronics')
      })
    })

    it('filters products by price range', async () => {
      const filters: FilterOptions = {
        minPrice: 50,
        maxPrice: 200,
      }
      const products = await getProducts(filters)

      products.forEach((product) => {
        expect(product.price).toBeGreaterThanOrEqual(50)
        expect(product.price).toBeLessThanOrEqual(200)
      })
    })

    it('filters products by stock status', async () => {
      const inStockFilters: FilterOptions = { inStock: true }
      const inStockProducts = await getProducts(inStockFilters)

      inStockProducts.forEach((product) => {
        expect(product.stock).toBeGreaterThan(0)
      })

      const outOfStockFilters: FilterOptions = { inStock: false }
      const outOfStockProducts = await getProducts(outOfStockFilters)

      expect(outOfStockProducts.length).toBeGreaterThan(0)
      outOfStockProducts.forEach((product) => {
        expect(product.stock).toBeLessThanOrEqual(0)
      })
    })

    it('hands out copies so callers cannot mutate the catalogue', async () => {
      const [first] = await getProducts()
      first.stock = -999

      const [refetched] = await getProducts()
      expect(refetched.stock).not.toBe(-999)
    })
  })

  describe('listProducts', () => {
    it('returns one page at a time with the total attached', async () => {
      const page = await listProducts({ page: 1, pageSize: 5 })

      expect(page.items).toHaveLength(5)
      expect(page.totalCount).toBe(mockProducts.length)
      expect(page.totalPages).toBe(Math.ceil(mockProducts.length / 5))
    })

    it('searches across name, SKU and description', async () => {
      const page = await listProducts({ search: 'keyboard', pageSize: 50 })

      expect(page.totalCount).toBeGreaterThan(0)
      page.items.forEach((product) => {
        expect(`${product.name} ${product.sku} ${product.description}`.toLowerCase()).toContain(
          'keyboard'
        )
      })
    })

    it('clamps a page number past the end back onto the last page', async () => {
      const page = await listProducts({ page: 999, pageSize: 5 })
      expect(page.page).toBe(page.totalPages)
    })
  })

  describe('getProduct', () => {
    it('returns null for an unknown id', async () => {
      await expect(getProduct('does-not-exist')).resolves.toBeNull()
    })
  })

  describe('getInventorySummary', () => {
    it('counts SKUs, units and the stock states', async () => {
      const summary = await getInventorySummary()

      expect(summary.skuCount).toBe(mockProducts.length)
      expect(summary.outOfStockCount).toBe(
        mockProducts.filter((product) => product.stock === 0).length
      )
      expect(summary.unitCount).toBe(
        mockProducts.reduce((total, product) => total + product.stock, 0)
      )
    })
  })

  describe('createProduct', () => {
    const validProduct: CreateProductRequest = {
      name: 'Test Product',
      description: 'Test Description',
      category: 'Electronics',
      price: 99.99,
      stock: 10,
      sku: 'TEST-123',
    }

    it('creates a new product successfully', async () => {
      const response = await createProduct(validProduct)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe('Test Product')
      expect(response.message).toBe('Product created successfully')
    })

    it('throws error for invalid product data', async () => {
      const invalidProduct = { ...validProduct, name: '' } as CreateProductRequest

      await expect(createProduct(invalidProduct)).rejects.toThrow('Product name is required')
    })

    it('throws error for negative price', async () => {
      const invalidProduct: CreateProductRequest = { ...validProduct, price: -10 }

      await expect(createProduct(invalidProduct)).rejects.toThrow(
        'Price must be between 0.01 and'
      )
    })

    it('rejects a fractional stock count', async () => {
      await expect(createProduct({ ...validProduct, stock: 1.5 })).rejects.toThrow(
        'Stock must be a non-negative integer'
      )
    })

    it('rejects a SKU that is already in the catalogue', async () => {
      await expect(
        createProduct({ ...validProduct, sku: mockProducts[0].sku })
      ).rejects.toMatchObject({ code: 'DUPLICATE_SKU' })
    })
  })

  describe('updateProduct', () => {
    it('merges only the fields that were sent', async () => {
      const [original] = await getProducts()
      const response = await updateProduct({ id: original.id, price: 12.5 })

      expect(response.data.price).toBe(12.5)
      expect(response.data.name).toBe(original.name)
      expect(response.data.description).toBe(original.description)
      expect(response.data.createdAt).toBe(original.createdAt)
    })

    it('leaves a field alone when it is sent as undefined', async () => {
      const [original] = await getProducts()
      const response = await updateProduct({ id: original.id, name: undefined })

      expect(response.data.name).toBe(original.name)
    })

    it('reports a missing product as NOT_FOUND', async () => {
      await expect(updateProduct({ id: 'nope', price: 1 })).rejects.toBeInstanceOf(ApiException)
      await expect(updateProduct({ id: 'nope', price: 1 })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('adjustStock', () => {
    it('adds received units to the count on hand', async () => {
      const [product] = await getProducts()
      const response = await adjustStock({ id: product.id, delta: 3 })

      expect(response.data.stock).toBe(product.stock + 3)
    })

    it('refuses to ship more units than are on hand', async () => {
      const [product] = await getProducts()

      await expect(
        adjustStock({ id: product.id, delta: -(product.stock + 1) })
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
    })

    it('leaves the stored count untouched when it refuses', async () => {
      const [product] = await getProducts()

      await expect(
        adjustStock({ id: product.id, delta: -(product.stock + 1) })
      ).rejects.toBeInstanceOf(ApiException)

      const after = await getProduct(product.id)
      expect(after?.stock).toBe(product.stock)
    })

    it('rejects a zero adjustment', async () => {
      const [product] = await getProducts()
      await expect(adjustStock({ id: product.id, delta: 0 })).rejects.toThrow(
        'Stock adjustment must be a non-zero integer'
      )
    })
  })

  describe('deleteProduct', () => {
    it('removes the product from the catalogue', async () => {
      const [product] = await getProducts()
      await deleteProduct(product.id)

      const remaining = await getProducts()
      expect(remaining).toHaveLength(mockProducts.length - 1)
      expect(remaining.find((item) => item.id === product.id)).toBeUndefined()
    })
  })
})
