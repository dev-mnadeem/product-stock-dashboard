/**
 * @jest-environment node
 */
import {
  HttpChatCompleter,
  LexicalCategorySuggester,
  ModelCategorySuggester,
} from '@/lib/ai/categorySuggester'

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
})

/** A fetch that never answers on its own and only settles when aborted. */
const hangingFetch = jest.fn(
  (_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    })
)

describe('HttpChatCompleter', () => {
  it('posts the prompt to the chat completions endpoint and returns the reply', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'hello' } }] }), {
        status: 200,
      })
    )
    global.fetch = fetchMock

    const reply = await new HttpChatCompleter(
      'demo-key',
      'http://model.test/v1/',
      'demo'
    ).complete('prompt')

    expect(reply).toBe('hello')
    expect(fetchMock.mock.calls[0][0]).toBe('http://model.test/v1/chat/completions')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      model: 'demo',
      messages: [{ role: 'user', content: 'prompt' }],
    })
  })

  it('rejects on a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('nope', { status: 502 }))

    await expect(
      new HttpChatCompleter('demo-key', 'http://model.test/v1', 'demo').complete('prompt')
    ).rejects.toThrow('HTTP 502')
  })

  it('gives up on an endpoint that never answers', async () => {
    global.fetch = hangingFetch as unknown as typeof fetch

    await expect(
      new HttpChatCompleter('demo-key', 'http://model.test/v1', 'demo', 20).complete('prompt')
    ).rejects.toBeDefined()
  })

  it('lets the model suggester fall back to the lexical answer after a timeout', async () => {
    global.fetch = hangingFetch as unknown as typeof fetch

    const suggester = new ModelCategorySuggester({
      completer: new HttpChatCompleter('demo-key', 'http://model.test/v1', 'demo', 20),
      fallback: new LexicalCategorySuggester(),
    })

    const [top] = await suggester.suggest({ name: 'Wireless Bluetooth Headphones' })
    expect(top.category).toBe('Electronics')
  })
})
