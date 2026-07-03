'use client'

import { useEffect, useState } from 'react'

/**
 * Holds a value still for `delayMs` after the last change. The search box uses
 * it so typing "keyboard" issues one catalogue read instead of eight.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
