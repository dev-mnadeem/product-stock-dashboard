import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('useDebouncedValue', () => {
  it('returns the initial value straight away', () => {
    const { result } = renderHook(() => useDebouncedValue('first', 200))
    expect(result.current).toBe('first')
  })

  it('holds the new value until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    expect(result.current).toBe('a')

    act(() => {
      jest.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe('ab')
  })

  it('only emits the last value in a burst of changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    act(() => jest.advanceTimersByTime(100))
    rerender({ value: 'abc' })
    act(() => jest.advanceTimersByTime(100))
    rerender({ value: 'abcd' })
    act(() => jest.advanceTimersByTime(200))

    expect(result.current).toBe('abcd')
  })
})
