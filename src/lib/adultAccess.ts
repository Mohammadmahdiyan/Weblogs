import { useEffect, useState } from 'react'

export const ADULT_CONFIRMATION_KEY = 'weblogs-adult-confirmed-v1'
const ADULT_ACCESS_EVENT = 'weblogs-adult-access-changed'

export function isAdultConfirmed(): boolean {
  try {
    return window.localStorage.getItem(ADULT_CONFIRMATION_KEY) === 'true'
  } catch {
    return false
  }
}

export function confirmAdultAccess(): void {
  try {
    window.localStorage.setItem(ADULT_CONFIRMATION_KEY, 'true')
  } catch {
    // The current visit can continue even when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(ADULT_ACCESS_EVENT))
}

export function useAdultAccess(): boolean {
  const [confirmed, setConfirmed] = useState(isAdultConfirmed)

  useEffect(() => {
    const update = () => setConfirmed(isAdultConfirmed())
    window.addEventListener(ADULT_ACCESS_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(ADULT_ACCESS_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return confirmed
}
