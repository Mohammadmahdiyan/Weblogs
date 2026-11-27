import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/** How far down the page has to be scrolled before the button appears. */
const SHOW_AFTER_PX = 600

/** A faint round button in the corner that takes the reader back to the top; fully visible on hover / focus. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  function goTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="رفتن به بالای صفحه"
      title="رفتن به بالای صفحه"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={
        'scroll-top-button fixed bottom-5 end-5 z-40 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-card)] transition-opacity duration-200 print:hidden ' +
        (visible ? 'opacity-45 hover:opacity-100 focus-visible:opacity-100' : 'pointer-events-none opacity-0')
      }
    >
      <ArrowUp aria-hidden="true" className="size-5" />
    </button>
  )
}
