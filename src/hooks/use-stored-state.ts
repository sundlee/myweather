"use client"

import * as React from "react"

const EVENT = "myweather:storage"
// localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)을 위한 메모리 보관소
const memory = new Map<string, string>()

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(EVENT, callback)
  }
}

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

/** localStorage에 저장되는 상태. 서버 렌더링 시에는 기본값을 사용한다. */
export function useStoredState<T>(key: string, fallback: T, isValid: (v: unknown) => v is T) {
  const raw = React.useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  )

  const value = React.useMemo(() => {
    if (raw == null) return fallback
    try {
      const parsed: unknown = JSON.parse(raw)
      return isValid(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }, [raw, fallback, isValid])

  const setValue = React.useCallback(
    (next: T) => {
      const json = JSON.stringify(next)
      memory.set(key, json)
      try {
        localStorage.setItem(key, json)
      } catch {}
      window.dispatchEvent(new Event(EVENT))
    },
    [key]
  )

  return [value, setValue] as const
}
