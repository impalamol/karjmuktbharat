import { useEffect, useMemo, useRef } from 'react'

/** Trailing debounce; the latest callback is always used. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  const ref = useRef(fn)
  ref.current = fn
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  return useMemo(
    () =>
      (...args: A) => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => ref.current(...args), ms)
      },
    [ms],
  )
}
