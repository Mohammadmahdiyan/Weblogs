import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Minus, Plus, X } from 'lucide-react'
import {
  LightboxContext,
  LightboxRegistrationContext,
  type LightboxMedia,
  type OpenLightbox,
  type RegisterLightboxMedia,
} from '../lib/lightbox'

interface RegisteredMedia {
  id: string
  media: LightboxMedia
  element: HTMLElement | null
}

interface LightboxState {
  items: LightboxMedia[]
  index: number
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [registered, setRegistered] = useState<RegisteredMedia[]>([])
  const [lightboxState, setLightboxState] = useState<LightboxState | null>(null)

  const registerMedia = useCallback<RegisterLightboxMedia>((id, media, element) => {
    setRegistered((current) => {
      const next = current.filter((item) => item.id !== id)
      if (element) next.push({ id, media, element })
      next.sort((first, second) => {
        if (!first.element || !second.element || first.element === second.element) return 0
        const position = first.element.compareDocumentPosition(second.element)
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      })
      return next
    })
    return () => setRegistered((current) => current.filter((item) => item.id !== id))
  }, [])

  const openLightbox = useCallback<OpenLightbox>((media, gallery) => {
    const items = gallery?.length ? gallery : registered.map((item) => item.media)
    const usableItems = items.length > 0 ? items : [media]
    const index = usableItems.findIndex((item) => item.url === media.url && item.type === media.type)
    setLightboxState({ items: usableItems, index: Math.max(0, index) })
  }, [registered])

  const closeLightbox = useCallback(() => setLightboxState(null), [])

  const registrationValue = useMemo(() => registerMedia, [registerMedia])

  return (
    <LightboxRegistrationContext.Provider value={registrationValue}>
      <LightboxContext.Provider value={openLightbox}>
        {children}
        {lightboxState && (
          <LightboxDialog
            state={lightboxState}
            onClose={closeLightbox}
            onChange={(index) => setLightboxState((current) => current ? { ...current, index } : current)}
          />
        )}
      </LightboxContext.Provider>
    </LightboxRegistrationContext.Provider>
  )
}

function LightboxDialog({
  state,
  onClose,
  onChange,
}: {
  state: LightboxState
  onClose: () => void
  onChange: (index: number) => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const pinchDistanceRef = useRef<number | null>(null)
  const draggedRef = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const captionId = useId()
  const activeMedia = state.items[state.index]
  const nextMedia = state.items[(state.index + 1) % state.items.length]
  const hasNavigation = state.items.length > 1
  const isOpen = true

  const setMediaIndex = useCallback((offset: number) => {
    if (state.items.length < 2) return
    setZoom(1)
    setPan({ x: 0, y: 0 })
    videoRef.current?.pause()
    onChange((state.index + offset + state.items.length) % state.items.length)
  }, [onChange, state.index, state.items.length])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    videoRef.current?.play().catch(() => undefined)
  }, [activeMedia.url, activeMedia.type])

  useEffect(() => {
    if (nextMedia.type !== 'image') return
    const preload = new Image()
    preload.src = nextMedia.url
  }, [nextMedia.type, nextMedia.url])

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    const isRtl = document.documentElement.dir === 'rtl'
    if (event.key === 'ArrowRight' && hasNavigation) {
      event.preventDefault()
      setMediaIndex(isRtl ? -1 : 1)
      return
    }
    if (event.key === 'ArrowLeft' && hasNavigation) {
      event.preventDefault()
      setMediaIndex(isRtl ? 1 : -1)
      return
    }

    if (event.key === 'Tab' && overlayRef.current) {
      const focusable = Array.from(overlayRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
      ))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  function close() {
    videoRef.current?.pause()
    onClose()
  }

  function onBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) close()
  }

  function onWheel(event: React.WheelEvent<HTMLImageElement>) {
    event.preventDefault()
    setZoom((current) => Math.max(1, Math.min(4, current - Math.sign(event.deltaY) * 0.15)))
  }

  function onPointerDown(event: ReactPointerEvent<HTMLImageElement>) {
    if (zoom <= 1) return
    pointerRef.current = { x: event.clientX, y: event.clientY }
    draggedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLImageElement>) {
    if (!pointerRef.current || zoom <= 1) return
    const dx = event.clientX - pointerRef.current.x
    const dy = event.clientY - pointerRef.current.y
    if (Math.abs(dx) + Math.abs(dy) > 2) draggedRef.current = true
    pointerRef.current = { x: event.clientX, y: event.clientY }
    setPan((current) => ({ x: current.x + dx, y: current.y + dy }))
  }

  function onTouchStart(event: ReactTouchEvent<HTMLImageElement>) {
    if (event.touches.length !== 2) return
    const [first, second] = Array.from(event.touches)
    pinchDistanceRef.current = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
  }

  function onTouchMove(event: ReactTouchEvent<HTMLImageElement>) {
    if (event.touches.length !== 2 || pinchDistanceRef.current === null) return
    event.preventDefault()
    draggedRef.current = true
    const [first, second] = Array.from(event.touches)
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
    const ratio = distance / pinchDistanceRef.current
    setZoom((current) => Math.max(1, Math.min(4, current * ratio)))
    pinchDistanceRef.current = distance
  }

  const portal = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="نمایش رسانه"
      aria-describedby={activeMedia.alt || activeMedia.title ? captionId : undefined}
      dir="rtl"
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
      className="lightbox-enter fixed inset-0 z-100 flex min-h-screen flex-col bg-black/95 text-white"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p id={captionId} className="m-0 min-w-0 flex-1 truncate text-start text-sm text-white/80">
          {activeMedia.alt || activeMedia.title || 'نمایش رسانه'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {hasNavigation && <span aria-live="polite" className="min-w-14 text-center text-sm tabular-nums">{state.index + 1} / {state.items.length}</span>}
          <button type="button" onClick={() => setZoom((current) => current > 1 ? 1 : 2)} aria-label={zoom > 1 ? 'کوچک‌نمایی' : 'بزرگ‌نمایی'} className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
            {zoom > 1 ? <Minus aria-hidden="true" className="size-5" /> : <Plus aria-hidden="true" className="size-5" />}
          </button>
          <button ref={closeButtonRef} type="button" onClick={close} aria-label="بستن نمایشگر" className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>

      <div
        data-lightbox-stage="true"
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-14 py-3 sm:px-20"
      >
        {activeMedia.type === 'image' ? (
          <img
            src={activeMedia.url}
            alt={activeMedia.alt ?? ''}
            draggable={false}
            onClick={() => {
              if (draggedRef.current) {
                draggedRef.current = false
                return
              }
              setZoom((current) => current > 1 ? 1 : 2)
            }}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => { pointerRef.current = null }}
            onPointerCancel={() => { pointerRef.current = null }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { pinchDistanceRef.current = null }}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, touchAction: 'none' }}
            className="max-h-full max-w-full cursor-zoom-in select-none object-contain transition-transform duration-150 motion-reduce:transition-none"
          />
        ) : (
          <video
            ref={videoRef}
            src={activeMedia.url}
            poster={activeMedia.poster}
            controls
            playsInline
            autoPlay
            aria-label={activeMedia.alt || activeMedia.title || 'ویدیو'}
            className="max-h-full max-w-full rounded-[var(--radius-sm)]"
          />
        )}

        {hasNavigation && (
          <>
            <button type="button" onClick={() => setMediaIndex(-1)} aria-label="رسانه قبلی" className="absolute inset-s-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white sm:inset-s-5">
              <ArrowLeft aria-hidden="true" className="size-5 rtl:rotate-180" />
            </button>
            <button type="button" onClick={() => setMediaIndex(1)} aria-label="رسانه بعدی" className="absolute inset-e-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white sm:inset-e-5">
              <ArrowRight aria-hidden="true" className="size-5 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>
      <footer className="h-5 shrink-0" />
    </div>
  )

  return isOpen ? createPortal(portal, document.body) : null
}