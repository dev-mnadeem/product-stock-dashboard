import {
  LexicalCategorySuggester,
  ModelCategorySuggester,
  buildPrompt,
  createCategorySuggester,
  parseModelReply,
  type ChatCompleter,
} from '@/lib/ai/categorySuggester'

describe('LexicalCategorySuggester', () => {
  const suggester = new LexicalCategorySuggester()

  it('picks Electronics for a bluetooth headphone', async () => {
    const [top] = await suggester.suggest({
      name: 'Wireless Bluetooth Headphones',
      description: 'Noise cancelling with a USB-C charger',
    })

    expect(top.category).toBe('Electronics')
    expect(top.confidence).toBeGreaterThan(0)
    expect(top.reason).toContain('matched')
  })

  it('picks Beauty for a face cream', async () => {
    const [top] = await suggester.suggest({
      name: 'Luxury Face Cream',
      description: 'Ceramide night cream with SPF 30',
    })

    expect(top.category).toBe('Beauty')
  })

  it('returns nothing rather than guessing on empty input', async () => {
    await expect(suggester.suggest({ name: '', description: '' })).resolves.toEqual([])
  })

  it('returns nothing when no lexicon term appears', async () => {
    await expect(
      suggester.suggest({ name: 'qqzzxx', description: 'wubble frotz' })
    ).resolves.toEqual([])
  })

  it('is deterministic across calls', async () => {
    const input = { name: 'Cork Yoga Mat', description: 'Non-slip training mat' }
    await expect(suggester.suggest(input)).resolves.toEqual(await suggester.suggest(input))
  })

  it('returns at most three ranked suggestions', async () => {
    const result = await suggester.suggest({
      name: 'Car mount for a phone with a wireless charger',
      description: 'Dashboard bracket, cotton cloth, book of instructions, yoga',
    })

    expect(result.length).toBeLessThanOrEqual(3)
    const confidences = result.map((entry) => entry.confidence)
    expect([...confidences].sort((a, b) => b - a)).toEqual(confidences)
  })
})

describe('parseModelReply', () => {
  it('reads a JSON object out of a chatty reply', () => {
    const parsed = parseModelReply(
      'Sure! {"suggestions":[{"category":"Books","confidence":0.9,"reason":"a novel"}]} Hope that helps.'
    )

    expect(parsed).toEqual([{ category: 'Books', confidence: 0.9, reason: 'a novel' }])
  })

  it('drops categories the catalogue does not have', () => {
    const parsed = parseModelReply('{"suggestions":[{"category":"Groceries","confidence":1}]}')
    expect(parsed).toEqual([])
  })

  it('clamps a confidence outside 0-1', () => {
    const parsed = parseModelReply('{"suggestions":[{"category":"Toys","confidence":7}]}')
    expect(parsed[0].confidence).toBe(1)
  })

  it('returns nothing for a reply with no JSON at all', () => {
    expect(parseModelReply('I am not sure.')).toEqual([])
  })
})

describe('ModelCategorySuggester', () => {
  const fallback = new LexicalCategorySuggester()

  it('uses the model answer when it parses', async () => {
    const completer: ChatCompleter = {
      complete: async () =>
        '{"suggestions":[{"category":"Toys","confidence":0.8,"reason":"play"}]}',
    }

    const result = await new ModelCategorySuggester({ completer, fallback }).suggest({
      name: 'Wireless Bluetooth Headphones',
    })

    expect(result[0].category).toBe('Toys')
  })

  it('falls back to the lexical answer when the model throws', async () => {
    const completer: ChatCompleter = {
      complete: async () => {
        throw new Error('network down')
      },
    }

    const result = await new ModelCategorySuggester({ completer, fallback }).suggest({
      name: 'Wireless Bluetooth Headphones',
    })

    expect(result[0].category).toBe('Electronics')
  })

  it('falls back when the model replies with nothing usable', async () => {
    const completer: ChatCompleter = { complete: async () => 'no idea' }

    const result = await new ModelCategorySuggester({ completer, fallback }).suggest({
      name: 'Cast Iron Skillet',
      description: 'Kitchen pan for the oven',
    })

    expect(result[0].category).toBe('Home & Garden')
  })
})

describe('buildPrompt', () => {
  it('constrains the model to the catalogue categories', () => {
    const prompt = buildPrompt({ name: 'Mallet', description: 'A hammer' })
    expect(prompt).toContain('Electronics, Clothing, Books')
    expect(prompt).toContain('Mallet')
  })
})

describe('createCategorySuggester', () => {
  it('returns the offline suggester when no API key is configured', () => {
    expect(createCategorySuggester({} as NodeJS.ProcessEnv).id).toBe('lexical')
  })

  it('returns the model-backed suggester once a key is present', () => {
    expect(createCategorySuggester({ AI_API_KEY: 'test-key' } as NodeJS.ProcessEnv).id).toBe(
      'model'
    )
  })
})
