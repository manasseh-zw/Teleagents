import { useCallback, useState } from "react"

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T
  defaultProp: T
  onChange?: (state: T) => void
}) {
  const [internal, setInternal] = useState<T>(defaultProp)
  const isControlled = prop !== undefined
  const value = (isControlled ? prop : internal) as T

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextValue =
        typeof next === "function" ? (next as (p: T) => T)(value) : next
      if (!isControlled) {
        setInternal(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange, value]
  )

  return [value, setValue] as const
}
