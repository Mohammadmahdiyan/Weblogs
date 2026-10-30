import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import storyJson from '../generated/story.json'
import siteConfig from '../site.config'
import { isStoryExpired, markStorySeen, readSeenStory, slideSeconds, type StoryData, type StorySlide } from '../lib/story'
import { ProfileAvatar } from './ProfileAvatar'

const story = storyJson as StoryData | null

/** `**bold**`, `[label](url)` and line breaks: the only Markdown a story caption understands. */
function renderCaption(text: string, onNavigate: () => void): ReactNode {
  return text.split('\n').map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, partIndex) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/)
        if (bold) return <strong key={partIndex}>{bold[1]}</strong>
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!link) return part
        const [, label, href] = link
        if (href.startsWith('/') && !href.startsWith('//')) return <Link key={partIndex} to={href} onClick={onNavigate} className="story-link">{label}</Link>
        if (/^https?:\/\//i.test(href)) return <a key={partIndex} href={href} target="_blank" rel="noopener noreferrer" className="story-link">{label}</a>
        return label
      })}
    </Fragment>
  ))
}

function SlideBody({ slide, onReady, onNavigate }: { slide: StorySlide; onReady: () => void; onNavigate: () => void }) {
  if (slide.kind === 'image') {
    return (
      <>
        <img src={slide.src} alt={slide.caption ? '' : 'تصویر استوری'} draggable={false} onLoad={onReady} onError={onReady} className="story-image" />
        {slide.caption && <div className="story-caption">{renderCaption(slide.caption, onNavigate)}</div>}
      </>
    )
  }

  return (
    <div className="story-card">
      {slide.src && <img src={slide.src} alt="" draggable={false} className="story-card-bg" />}
      <div className="story-card-text">
        {slide.kicker && <p className="story-kicker">{slide.kicker}</p>}
        {slide.title && <p className="story-title">{slide.title}</p>}
        {slide.caption && <p className="story-text">{renderCaption(slide.caption, onNavigate)}</p>}
        {slide.kind === 'link' && slide.link && (
          slide.link.href.startsWith('/')
            ? <Link to={slide.link.href} onClick={onNavigate} className="story-cta">{slide.link.label}</Link>
            : <a href={slide.link.href} target="_blank" rel="noopener noreferrer" className="story-cta">{slide.link.label}</a>
        )}
      </div>
    </div>
  )
}

function StoryViewer({ data, onClose }: { data: StoryData; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const holdTimer = useRef<number | undefined>(undefined)
  const held = useRef(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [readyIndex, setReadyIndex] = useState<number | null>(null)

  const last = data.slides.length - 1
  const slide = data.slides[index]
  const ready = slide.kind !== 'image' || readyIndex === index
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
    }
  }, [])

  // Warm the next picture so it is ready when the bar ends.
  useEffect(() => {
    const upcoming = data.slides[index + 1]
    if (upcoming?.kind === 'image' && upcoming.src) new Image().src = upcoming.src
  }, [data.slides, index])

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const rtl = overlayRef.current ? getComputedStyle(overlayRef.current).direction === 'rtl' : true
    if (event.key === 'Escape') { event.preventDefault(); onClose() }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); if (rtl) next(); else previous() }
    else if (event.key === 'ArrowRight') { event.preventDefault(); if (rtl) previous(); else next() }
    else if (event.key === ' ' && event.target === event.currentTarget) { event.preventDefault(); setPaused((value) => !value) }
    else if (event.key === 'Tab' && overlayRef.current) {
      const focusable = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('button, a[href]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const final = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); final.focus() }
      else if (!event.shiftKey && document.activeElement === final) { event.preventDefault(); first.focus() }
    }
  }

  // Press and hold on the picture pauses it (like Instagram); a short tap changes slide.
  function holdStart() {
    held.current = false
    window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => { held.current = true; setPaused(true) }, 220)
  }
  function holdEnd() {
    window.clearTimeout(holdTimer.current)
    if (held.current) setPaused(false)
  }
  function tap(action: () => void) {
    if (held.current) { held.current = false; return }
    action()
  }

  const zoneProps = { onPointerDown: holdStart, onPointerUp: holdEnd, onPointerLeave: holdEnd, onPointerCancel: holdEnd, onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault() }

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
      <div className="story-stage">
        <SlideBody key={index} slide={slide} onReady={() => setReadyIndex(index)} onNavigate={onClose} />

        <button type="button" aria-label="اسلاید قبلی" className="story-zone story-zone-prev" onClick={() => tap(previous)} {...zoneProps} />
        <button type="button" aria-label="اسلاید بعدی" className="story-zone story-zone-next" onClick={() => tap(next)} {...zoneProps} />

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
            <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن استوری" className="story-close"><X aria-hidden="true" className="size-5" /></button>
          </div>
        </div>
      </div>
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
      <button type="button" onClick={openStory} aria-label={seen ? 'مشاهده دوبارهٔ استوری امروز' : 'مشاهدهٔ استوری امروز'} aria-haspopup="dialog" data-seen={seen} className={clsx('story-ring')}>
        <span className="story-ring-inner"><ProfileAvatar fallback={siteConfig.profile.name.charAt(0)} /></span>
      </button>
      {open && <StoryViewer data={story} onClose={() => setOpen(false)} />}
    </>
  )
}
