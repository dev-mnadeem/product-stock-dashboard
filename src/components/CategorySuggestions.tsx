'use client'

import type { CategorySuggestion } from '@/lib/ai/categorySuggester'

interface CategorySuggestionsProps {
  suggestions: CategorySuggestion[]
  loading: boolean
  selected?: string
  onSelect: (category: string) => void
}

/**
 * Suggested categories for the text typed so far. Purely advisory — the select
 * remains the field of record, and the form submits fine if these are ignored.
 */
export function CategorySuggestions({
  suggestions,
  loading,
  selected,
  onSelect,
}: CategorySuggestionsProps) {
  if (!loading && suggestions.length === 0) {
    return null
  }

  return (
    <div className="mt-2" aria-live="polite">
      <p className="text-xs text-secondary-500">
        {loading ? 'Looking at the name and description…' : 'Suggested categories'}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.category}
            type="button"
            onClick={() => onSelect(suggestion.category)}
            title={suggestion.reason}
            aria-pressed={selected === suggestion.category}
            className={`pill border transition-colors ${
              selected === suggestion.category
                ? 'border-primary-500 bg-primary-50 text-primary-800'
                : 'border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-100'
            }`}
          >
            {suggestion.category}
            <span className="tabular text-secondary-400">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
