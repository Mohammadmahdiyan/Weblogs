import { Children, isValidElement, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { useFont } from '../../lib/font'
import { galleryRows } from '../../lib/gallery'
import { ImageWithFallback } from '../ImageWithFallback'
import { LightboxContext, useLightbox, useLightboxRegistration, type LightboxMedia, type OpenLightbox } from '../../lib/lightbox'

export function MarkdownImage({
  src, alt = '', width, height, title, className, style, ...props
}: ComponentPropsWithoutRef<'img'>) {
  const openLightbox = useLightbox()
  const registerMedia = useLightboxRegistration()
  const id = useId()
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const dimensions = width && height ? { aspectRatio: `${width} / ${height}` } : undefined

  useEffect(() => {
    if (!src) return
    return registerMedia(id, { url: src, type: 'image', alt, title: title ?? undefined }, imageButtonRef.current)
  }, [alt, id, registerMedia, src, title])

  return (
    <button
      ref={imageButtonRef}
      type="button"
      onClick={() => src && openLightbox({ url: src, type: 'image', alt, title: title ?? undefined })}
      aria-label={alt ? `نمایش تصویر: ${alt}` : 'نمایش تصویر'}
      className="not-prose my-4 flex h-auto w-full max-w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--info)]"
    >
      <ImageWithFallback
        {...props}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        style={{ ...style, ...dimensions }}
        className={clsx('block h-auto w-full max-w-full', className)}
        fallbackClassName="aspect-video w-full max-w-full"
      />
    </button>
  )
}

export function MarkdownVideo({
  src, poster, title, onClick, className, ...props
}: ComponentPropsWithoutRef<'video'>) {
  const openLightbox = useLightbox()
  const registerMedia = useLightboxRegistration()
  const id = useId()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!src) return
    return registerMedia(id, { url: src, type: 'video', alt: title, title, poster: poster ?? undefined }, videoRef.current)
  }, [id, poster, registerMedia, src, title])

  return (
    <video
      ref={videoRef}
      {...props}
      src={src}
      poster={poster}
      title={title}
      controls
      playsInline
      onClick={(event) => {
        onClick?.(event)
        if (src) openLightbox({ url: src, type: 'video', alt: title, title, poster: poster ?? undefined })
      }}
      className={clsx('my-4 max-h-[80vh] w-full rounded-[var(--radius-sm)] bg-[var(--surface-strong)]', className)}
    />
  )
}

export function VideoDirective({ src = '', poster, title, alt }: { src?: string; poster?: string; title?: string; alt?: string }) {
  return <MarkdownVideo src={src} poster={poster} title={title ?? alt} aria-label={alt ?? title ?? 'ویدیو'} />
}

export function AudioDirective({ src = '', title, alt }: { src?: string; title?: string; alt?: string }) {
  return <audio src={src} controls preload="none" aria-label={alt ?? title ?? 'صوت'} className="not-prose my-4 w-full" />
}

const videoExtension = /\.(mp4|webm|ogv|mov|m4v)$/i

function pathnameOf(url: string): string {
  return url.split(/[?#]/, 1)[0]
}

interface GalleryItem {
  element: ReactElement
  media: LightboxMedia
}

/**
 * Finds every photo, GIF and video inside a gallery, however it was written
 * (`![](a.jpg)`, `![](a.mp4)`, `::video{src=…}`, raw <img>/<video>) and whether or not
 * Markdown wrapped adjacent lines in a paragraph.
 */
function collectGalleryItems(node: ReactNode): GalleryItem[] {
  if (Array.isArray(node)) return node.flatMap(collectGalleryItems)
  if (!isValidElement<{ src?: string; alt?: string; title?: string; poster?: string; children?: ReactNode }>(node)) return []
  const { src, alt, title, poster } = node.props

  if (node.type === MarkdownImage && typeof src === 'string') {
    return [{ element: node, media: { url: src, type: 'image', alt, title } }]
  }
  if (typeof src === 'string' && (node.type === MarkdownVideo || videoExtension.test(pathnameOf(src)))) {
    return [{ element: node, media: { url: src, type: 'video', alt: alt ?? title, title, poster } }]
  }
  return Children.toArray(node.props.children).flatMap(collectGalleryItems)
}

/** The page's rem scale is `fontPercent / 100`, so a "7rem" tile is 112px at 100%. */
const MIN_TILE_REM = 7

/**
 * Photo / GIF / video collection. Layout by count (see src/lib/gallery.ts): 1 item = plain media,
 * 2 = side by side, 3 = 2 + 1 full width, 4 = 2 × 2, 5 = 3 + 2, 6 = 3 + 3, more continue the same way.
 * The number per row shrinks as the reader raises the font size and grows as they lower it.
 */
export function Gallery({ children }: { children?: ReactNode }) {
  const openLightbox = useLightbox()
  const { size } = useFont()
  const items = collectGalleryItems(children)
  const lightboxItems = items.map((item) => item.media)
  const openGalleryItem: OpenLightbox = (item) =>
    openLightbox(item, lightboxItems)

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) return null

  if (items.length === 1) {
    return (
      <LightboxContext.Provider value={openGalleryItem}>
        {items[0].element}
      </LightboxContext.Provider>
    )
  }

  const tilePx = MIN_TILE_REM * 16 * (size / 100)
  const rows = galleryRows(
    items.length,
    size,
    width > 0
      ? Math.max(1, Math.floor(width / tilePx))
      : Number.POSITIVE_INFINITY,
  )

  return (
    <LightboxContext.Provider value={openGalleryItem}>
      <div
        ref={containerRef}
        data-gallery-rows={rows.join(',')}
        className="not-prose my-5 grid gap-3"
      >
        {rows.map((columns, rowIndex) => {
          const start = rows
            .slice(0, rowIndex)
            .reduce((total, count) => total + count, 0)

          const rowItems = items.slice(start, start + columns)

          return (
            <div
              key={rowIndex}
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map((item, index) => (
                <div
                  key={`${start}-${index}`}
                  className={clsx(
                    'relative h-full min-w-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-strong)]',
                    columns === 1
                      ? 'aspect-[16/9]'
                      : columns <= 3
                        ? 'aspect-[4/3]'
                        : 'aspect-square',
                    '[&>button]:!my-0 [&>button]:!flex [&>button]:!h-full [&>button]:!w-full [&>button]:!max-w-none',
                    '[&_img]:!h-full [&_img]:!w-full [&_img]:!max-w-none [&_img]:!max-h-none [&_img]:!object-cover',
                    '[&>video]:!my-0 [&>video]:!h-full [&>video]:!w-full [&>video]:!max-h-none [&>video]:!object-cover',
                  )}
                >
                  {item.element}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </LightboxContext.Provider>
  )
}
