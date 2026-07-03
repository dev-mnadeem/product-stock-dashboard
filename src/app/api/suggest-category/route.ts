import { NextResponse } from 'next/server'
import { createCategorySuggester } from '@/lib/ai/categorySuggester'

export const dynamic = 'force-dynamic'

const suggester = createCategorySuggester()

/**
 * Keeps the model call — and any API key — on the server. The browser only
 * ever sees the ranked categories.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; description?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name : ''
  const description = typeof body.description === 'string' ? body.description : ''

  if (!name.trim() && !description.trim()) {
    return NextResponse.json({ provider: suggester.id, suggestions: [] })
  }

  const suggestions = await suggester.suggest({ name, description })
  return NextResponse.json({ provider: suggester.id, suggestions })
}
