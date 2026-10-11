import { Children, isValidElement, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { LightboxContext, useLightbox, useLightboxRegistration, type LightboxMedia, type OpenLightbox } from '../../lib/lightbox'

export function MarkdownImage({
  src, alt = '', width, height, title, className, style, ...props
}: ComponentPropsWithoutRef<'img'>) {
  const openLightbox = useLightbox()
  const registerMedia = useLightboxRegistration()
  const id = useId()
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const dimensions = width && height ? { aspectRatio: `${width} / ${height}` } : undefined
  const [isLoaded, setIsLoaded] = useState(false)

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
      <img
        {...props}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{ ...style, ...dimensions }}
        className={clsx(
          'block h-auto w-full max-w-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0 blur-sm',
          className,
        )}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-strong)]">
          <span aria-hidden="true" className="text-xs text-[var(--text-muted)]">در حال بارگذاری…</span>
        </div>
      )}
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

function collectGalleryImages(node: ReactNode): LightboxMedia[] {
  if (Array.isArray(node)) return node.flatMap(collectGalleryImages)
  if (!isValidElement<{ src?: string; alt?: string; children?: ReactNode }>(node)) return []
  if (node.type === MarkdownImage && typeof node.props.src === 'string') {
    return [{ url: node.props.src, type: 'image', alt: node.props.alt }]
  }
  return Children.toArray(node.props.children).flatMap(collectGalleryImages)
}

export function Gallery({ children }: { children?: ReactNode }) {
  const openLightbox = useLightbox()
  const images = collectGalleryImages(children)
  const openGalleryItem: OpenLightbox = (item) => openLightbox(item, images)

  return (
    <LightboxContext.Provider value={openGalleryItem}>
      <div className="not-prose my-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&_p]:m-0">
        {children}
      </div>
    </LightboxContext.Provider>
  )
}