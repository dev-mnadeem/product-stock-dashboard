import { PRODUCT_CATEGORIES, type ProductCategory } from '@/types/product'

export interface CategorySuggestion {
  category: ProductCategory
  /** 0-1. How strongly the text points at this category. */
  confidence: number
  /** Why this category was proposed, shown under the suggestion chip. */
  reason: string
}

export interface CategorySuggestionInput {
  name: string
  description?: string
}

/**
 * The port. The create form talks to this and never to a vendor SDK, so the
 * repository runs identically with and without an API key.
 */
export interface CategorySuggester {
  readonly id: string
  suggest(input: CategorySuggestionInput): Promise<CategorySuggestion[]>
}

const LEXICON: Record<ProductCategory, string[]> = {
  Electronics: [
    'usb',
    'bluetooth',
    'wireless',
    'monitor',
    'keyboard',
    'headphone',
    'charger',
    'battery',
    'screen',
    'speaker',
    'camera',
    'laptop',
    'rgb',
    'hdmi',
    'sensor',
  ],
  Clothing: [
    'shirt',
    'tee',
    'jacket',
    'socks',
    'cotton',
    'wool',
    'merino',
    'denim',
    'hoodie',
    'trousers',
    'dress',
    'knit',
    'fit',
    'sleeve',
    'leather',
  ],
  Books: [
    'book',
    'edition',
    'paperback',
    'hardcover',
    'guide',
    'novel',
    'author',
    'notebook',
    'paper',
    'pages',
    'reference',
    'journal',
    'reading',
  ],
  'Home & Garden': [
    'kitchen',
    'skillet',
    'pot',
    'plant',
    'garden',
    'compost',
    'lamp',
    'cushion',
    'oven',
    'soil',
    'watering',
    'furniture',
    'storage',
    'towel',
    'candle',
  ],
  Sports: [
    'racket',
    'yoga',
    'dumbbell',
    'running',
    'fitness',
    'training',
    'bike',
    'gym',
    'mat',
    'ball',
    'workout',
    'outdoor',
    'climbing',
    'swim',
  ],
  Toys: [
    'toy',
    'blocks',
    'puzzle',
    'game',
    'play',
    'kids',
    'children',
    'marble',
    'board game',
    'lego',
    'doll',
    'ages',
    'build',
  ],
  Beauty: [
    'cream',
    'serum',
    'skin',
    'shampoo',
    'fragrance',
    'spf',
    'moisturiser',
    'moisturizer',
    'oil',
    'toothbrush',
    'lotion',
    'balm',
    'cosmetic',
    'beard',
  ],
  Automotive: [
    'car',
    'vehicle',
    'dashboard',
    'tyre',
    'tire',
    'engine',
    'jump starter',
    'detailing',
    'motor',
    'wiper',
    'automotive',
    'driving',
    'mount',
  ],
}

const MAX_SUGGESTIONS = 3

/**
 * Deterministic default. Scores each category by how many of its terms appear
 * in the product text, weighting the name over the description because a name
 * match is the stronger signal. No network, no key, same answer every run —
 * which is what makes it usable as the fallback for the model adapter.
 */
export class LexicalCategorySuggester implements CategorySuggester {
  readonly id = 'lexical'

  async suggest({
    name,
    description = '',
  }: CategorySuggestionInput): Promise<CategorySuggestion[]> {
    const nameText = name.toLowerCase()
    const bodyText = description.toLowerCase()

    if (!nameText.trim() && !bodyText.trim()) {
      return []
    }

    const scored = PRODUCT_CATEGORIES.map((category) => {
      const hits = LEXICON[category].filter(
        (term) => nameText.includes(term) || bodyText.includes(term)
      )
      const nameHits = hits.filter((term) => nameText.includes(term))
      const score = nameHits.length * 2 + (hits.length - nameHits.length)
      return { category, score, hits }
    }).filter((entry) => entry.score > 0)

    if (scored.length === 0) {
      return []
    }

    const best = Math.max(...scored.map((entry) => entry.score))

    return scored
      .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => ({
        category: entry.category,
        confidence: Number((entry.score / (best + 1)).toFixed(2)),
        reason: `matched ${entry.hits
          .slice(0, 3)
          .map((term) => `"${term}"`)
          .join(', ')}`,
      }))
  }
}

/** Minimal shape of an OpenAI-compatible chat endpoint. */
export interface ChatCompleter {
  complete(prompt: string): Promise<string>
}

export interface ModelSuggesterOptions {
  completer: ChatCompleter
  fallback: CategorySuggester
}

/**
 * Model-backed adapter. It constrains the model to the eight categories the
 * catalogue actually has and, on any failure — no key, timeout, unparseable
 * reply, a category that does not exist — returns the lexical answer rather
 * than an error, so the form never blocks on the model.
 */
export class ModelCategorySuggester implements CategorySuggester {
  readonly id = 'model'

  constructor(private readonly options: ModelSuggesterOptions) {}

  async suggest(input: CategorySuggestionInput): Promise<CategorySuggestion[]> {
    try {
      const reply = await this.options.completer.complete(buildPrompt(input))
      const parsed = parseModelReply(reply)
      if (parsed.length > 0) {
        return parsed
      }
    } catch {
      // Fall through to the deterministic suggester.
    }
    return this.options.fallback.suggest(input)
  }
}

export function buildPrompt({ name, description = '' }: CategorySuggestionInput): string {
  return [
    'Classify a retail product into exactly one of these categories:',
    PRODUCT_CATEGORIES.join(', '),
    '',
    `Product name: ${name}`,
    `Product description: ${description}`,
    '',
    'Reply with JSON only, shaped as',
    '{"suggestions":[{"category":"...","confidence":0.0,"reason":"..."}]}',
  ].join('\n')
}

export function parseModelReply(reply: string): CategorySuggestion[] {
  const start = reply.indexOf('{')
  const end = reply.lastIndexOf('}')
  if (start === -1 || end <= start) {
    return []
  }

  let payload: unknown
  try {
    payload = JSON.parse(reply.slice(start, end + 1))
  } catch {
    return []
  }

  const raw = (payload as { suggestions?: unknown }).suggestions
  if (!Array.isArray(raw)) {
    return []
  }

  const allowed = new Set<string>(PRODUCT_CATEGORIES)

  return raw
    .filter(
      (entry): entry is { category: string; confidence?: unknown; reason?: unknown } =>
        typeof entry === 'object' &&
        entry !== null &&
        allowed.has((entry as { category?: string }).category ?? '')
    )
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => ({
      category: entry.category as ProductCategory,
      confidence:
        typeof entry.confidence === 'number' && Number.isFinite(entry.confidence)
          ? Math.min(Math.max(entry.confidence, 0), 1)
          : 0.5,
      reason:
        typeof entry.reason === 'string' && entry.reason.trim()
          ? entry.reason.trim()
          : 'model suggestion',
    }))
}

/** OpenAI-compatible HTTP completer. Any base URL speaking that shape works. */
export class HttpChatCompleter implements ChatCompleter {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async complete(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Category model returned HTTP ${response.status}`)
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return body.choices?.[0]?.message?.content ?? ''
  }
}

/**
 * Chooses an adapter from the environment. With no `AI_API_KEY` present the
 * lexical suggester is returned, which is why `npm run dev` needs no secrets.
 */
export function createCategorySuggester(
  env: NodeJS.ProcessEnv = process.env
): CategorySuggester {
  const fallback = new LexicalCategorySuggester()
  const apiKey = env.AI_API_KEY?.trim()

  if (!apiKey) {
    return fallback
  }

  return new ModelCategorySuggester({
    completer: new HttpChatCompleter(
      apiKey,
      env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1',
      env.AI_MODEL?.trim() || 'gpt-4o-mini'
    ),
    fallback,
  })
}
