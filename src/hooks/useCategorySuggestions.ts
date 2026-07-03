'use client'

import { useEffect, useState } from 'react'
import { APP_CONFIG } from '@/config/app'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { CategorySuggestion } from '@/lib/ai/categorySuggester'

interface SuggestionState {
  suggestions: CategorySuggestion[]
  provider: string | null
  loading: boolean
}

const IDLE: SuggestionState = { suggestions: [], provider: null, loading: false }

/**
 * Asks the server route to rank categories for the text typed so far. The
 * request is debounced and aborted on the next keystroke, so a fast typist
 * issues one call rather than one per character.
 */
export function useCategorySuggestions(name: string, description: string): SuggestionState {
  const debouncedName = useDebouncedValue(name, APP_CONFIG.searchDebounceMs)
  const debouncedDescription = useDebouncedValue(description, APP_CONFIG.searchDebounceMs)
  const [state, setState] = useState<SuggestionState>(IDLE)

  useEffect(() => {
    if (debouncedName.trim().length < 3 && debouncedDescription.trim().length < 3) {
      setState(IDLE)
      return
    }

    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true }))

    fetch('/api/suggest-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: debouncedName, description: debouncedDescription }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((body: { provider?: string; suggestions?: CategorySuggestion[] }) => {
        setState({
          suggestions: body.suggestions ?? [],
          provider: body.provider ?? null,
          loading: false,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState(IDLE)
        }
      })

    return () => controller.abort()
  }, [debouncedName, debouncedDescription])

  return state
}
