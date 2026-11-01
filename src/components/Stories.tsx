import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import storyJson from '../generated/story.json'
import siteConfig from '../site.config'
import { isStoryExpired, markStorySeen, readSeenStory, slideSeconds, type StoryData, type StorySlide } from '../lib/story'
import { ProfileAvatar } from './ProfileAvatar'

// The Markdown engine is large and only needed once a story is opened.
const MarkdownRenderer = lazy(() => import('./MarkdownRenderer').then((module) => ({ default: module.MarkdownRenderer })))

const story = storyJson as StoryData | null
const HOLD_MS = 220
const MOVE_TOLERANCE_PX = 8
/** After the reader stops scrolling a long story, the timer waits this long before it continues. */
const SCROLL_REST_MS = 2000
/** What a tap must not steal: anything that does something by itself. */
const INTERACTIVE = 'a, button, summary, input, textarea, select, video, audio, [role="button"], [data-story-ui]'

function SlideBody({ slide, onReady, onNavigate, onScroll }: {
  slide: StorySlide
  onReady: () => void
  onNavigate: () => void
  onScroll: () => void
}) {
  if (slide.kind === 'image') {
    return <img src={slide.src} alt="تصویر استوری" draggable={false} onLoad={onReady} onError={onReady} className="story-image" />
  }

  return (
    <div className="story-scroll" tabIndex={0} role="region" aria-label="متن استوری" onScroll={onScroll}>
      <div className="story-md blog-scope">
        {slide.kicker && <p className="story-kicker">از مقالهٔ «{slide.kicker}»</p>}
        <Suspense fallback={<div aria-busy="true" className="story-skeleton"><span /><span /><span /></div>}>
          <MarkdownRenderer markdown={slide.markdown ?? ''} />
        </Suspense>
        {slide.link && (
          slide.link.href.startsWith('/')
            ? <Link to={slide.link.href} onClick={onNavigate} className="story-cta">{slide.link.label}</Link>
            : <a href={slide.link.href} target="_blank" rel="noopener noreferrer" className="story-cta">{slide.link.label}</a>
        )}
      </div>
    </div>
  )
}

interface Press {
  x: number
  y: number
  moved: boolean
  held: boolean
}

function StoryViewer({ data, onClose }: { data: StoryData; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const press = useRef<Press | null>(null)
  const holdTimer = useRef<number | undefined>(undefined)
  const scrollTimer = useRef<number | undefined>(undefined)
  const [index, setIndex] = useState(0)
  const [holding, setHolding] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [readyIndex, setReadyIndex] = useState<number | null>(null)

  const last = data.slides.length - 1
  const slide = data.slides[index]
  const ready = slide.kind !== 'image' || readyIndex === index
  const paused = holding || scrolling
  const seconds = slideSeconds(slide, siteConfig.story.slideSeconds)

  const next = useCallback(() => {
    if (index >= last) onClose()
    else setIndex(index + 1)
  }, [index, last, onClose])
  const previous = useCallback(() => setIndex((current) => Math.max(0, current - 1)), [])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
      window.clearTimeout(holdTimer.current)
      window.clearTimeout(scrollTimer.current)
    }
  }, [])

  // A new story starts un-paused, at the top.
  useEffect(() => {
    window.clearTimeout(scrollTimer.current)
    setScrolling(false)
    setHolding(false)
  }, [index])

  // Warm the next picture so it is ready when the bar ends.
  useEffect(() => {
    const upcoming = data.slides[index + 1]
    if (upcoming?.kind === 'image' && upcoming.src) new Image().src = upcoming.src
  }, [data.slides, index])

  const isRtl = () => (overlayRef.current ? getComputedStyle(overlayRef.current).direction === 'rtl' : true)

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const rtl = isRtl()
    if (event.key === 'Escape') { event.preventDefault(); onClose() }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); if (rtl) next(); else previous() }
    else if (event.key === 'ArrowRight') { event.preventDefault(); if (rtl) previous(); else next() }
    else if (event.key === ' ' && event.target === event.currentTarget) { event.preventDefault(); setHolding((value) => !value) }
    else if (event.key === 'Tab' && overlayRef.current) {
      const focusable = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const final = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); final.focus() }
      else if (!event.shiftKey && document.activeElement === final) { event.preventDefault(); first.focus() }
    }
  }

  // Tap: left / right half of the card changes story (in a right-to-left page, left = next). Press and hold:
  // pause. Dragging (scrolling a long text) is neither: the timer just waits while the reader scrolls.
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest(INTERACTIVE)) { press.current = null; return }
    press.current = { x: event.clientX, y: event.clientY, moved: false, held: false }
    window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      if (press.current && !press.current.moved) { press.current.held = true; setHolding(true) }
    }, HOLD_MS)
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = press.current
    if (!current || current.moved) return
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > MOVE_TOLERANCE_PX) {
      current.moved = true
      window.clearTimeout(holdTimer.current)
    }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    window.clearTimeout(holdTimer.current)
    const current = press.current
    press.current = null
    if (!current) return
    if (current.held) { setHolding(false); return }
    if (current.moved || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const leftHalf = event.clientX < rect.left + rect.width / 2
    if (leftHalf === isRtl()) next()
    else previous()
  }
  function onPointerCancel() {
    window.clearTimeout(holdTimer.current)
    if (press.current?.held) setHolding(false)
    press.current = null
  }

  function onScroll() {
    setScrolling(true)
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => setScrolling(false), SCROLL_REST_MS)
  }

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="استوری"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
      className="story-overlay"
    >
      <button type="button" aria-label="استوری قبلی" disabled={index === 0} onClick={previous} className="story-nav" data-story-ui>
        <ChevronRight aria-hidden="true" className="size-6 ltr:rotate-180" />
      </button>

      <div
        ref={stageRef}
        className="story-stage"
        data-tone={slide.kind === 'image' ? 'dark' : 'theme'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(event) => { if (holding) event.preventDefault() }}
      >
        <SlideBody key={index} slide={slide} onReady={() => setReadyIndex(index)} onNavigate={onClose} onScroll={onScroll} />

        <div className="story-top">
          <div className="story-bars" aria-hidden="true">
            {data.slides.map((_, barIndex) => (
              <span key={barIndex} className="story-bar">
                {barIndex < index && <span className="story-bar-fill" style={{ width: '100%' }} />}
                {barIndex === index && (
                  <span
                    key={`run-${index}`}
                    className="story-bar-fill story-bar-run"
                    style={{ animationDuration: `${seconds}s`, animationPlayState: paused || !ready ? 'paused' : 'running' } as CSSProperties}
                    onAnimationEnd={next}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="story-head">
            <span className="story-head-avatar"><ProfileAvatar fallback={siteConfig.profile.name.charAt(0)} /></span>
            <span className="story-head-name">{siteConfig.profile.name}</span>
            <span className="story-head-meta">{data.preview ? 'پیش‌نمایش · منتشر نشده' : 'امروز'}</span>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن استوری" className="story-close" data-story-ui><X aria-hidden="true" className="size-5" /></button>
          </div>
        </div>
      </div>

      <button type="button" aria-label="استوری بعدی" onClick={next} className="story-nav" data-story-ui>
        <ChevronLeft aria-hidden="true" className="size-6 ltr:rotate-180" />
      </button>
    </div>,
    document.body,
  )
}

/** The ring in the header (profile picture inside a coloured ring, grey once seen). Opens the story viewer. */
export function StoryButton() {
  const [open, setOpen] = useState(false)
  const [seenId, setSeenId] = useState<string | null>(() => readSeenStory())
  const [expired] = useState(() => (story ? isStoryExpired(story) : true))

  if (!siteConfig.story.enabled || !story || expired || story.slides.length === 0) return null

  const seen = seenId === story.id
  function openStory() {
    if (!story) return
    markStorySeen(story.id)
    setSeenId(story.id)
    setOpen(true)
  }

  return (
    <>
      <button type="button" onClick={openStory} aria-label={seen ? 'مشاهده دوبارهٔ استوری امروز' : 'مشاهدهٔ استوری امروز'} aria-haspopup="dialog" data-seen={seen} className="story-ring">
        <span className="story-ring-inner"><ProfileAvatar fallback={siteConfig.profile.name.charAt(0)} /></span>
      </button>
      {open && <StoryViewer data={story} onClose={() => setOpen(false)} />}
    </>
  )
}
