export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}

export type ApiErrorCode =
  'VALIDATION_ERROR' | 'DUPLICATE_SKU' | 'NOT_FOUND' | 'INSUFFICIENT_STOCK' | 'UNKNOWN'

export class ApiException extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

/**
 * Turns anything thrown by the data layer into a sentence safe to show a user.
 * Unknown throwables become a generic line rather than leaking a stack.
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiException) {
    return error.message
  }
  return fallback
}
