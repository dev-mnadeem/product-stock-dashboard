/**
 * Every tunable the inventory screen depends on lives here, so a reviewer can
 * change page size or the low-stock threshold without grepping components.
 */
export const APP_CONFIG = {
  /** Locale used for every currency and quantity string rendered by the app. */
  locale: 'en-US',
  currency: 'USD',
  /** A SKU at or below this many units is flagged "Low stock". */
  lowStockThreshold: 5,
  /** Rows per page in the inventory table and product grid. */
  pageSize: 8,
  /** Milliseconds the mock data layer waits before resolving, to expose loading states. */
  latency: {
    list: 450,
    read: 150,
    write: 300,
  },
  /** Debounce applied to the free-text search box and to category suggestions. */
  searchDebounceMs: 250,
  /** Largest price the create form and the data layer will accept. */
  maxPrice: 1_000_000,
  /** Largest single stock adjustment allowed from the table stepper. */
  maxStockAdjustment: 999,
} as const

export type AppConfig = typeof APP_CONFIG
