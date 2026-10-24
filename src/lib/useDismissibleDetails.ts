import { useEffect, type RefObject } from 'react'

/**
 * Makes a <details> popup behave like a menu: it closes when the reader clicks / taps anywhere outside it
 * and when Escape is pressed (focus then returns to its <summary>). Clicks inside it keep it open.
 * The element is read when an event happens, so it also works for a <details> that is rendered later.
 */
export function useDismissibleDetails(ref: RefObject<HTMLDetailsElement | null>): void {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const details = ref.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) details.open = false
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const details = ref.current
      if (event.key === 'Escape' && details?.open) {
        details.open = false
        details.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref])
}
