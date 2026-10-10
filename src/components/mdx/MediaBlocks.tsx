import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { LightboxContext, useLightbox, type LightboxMedia, type OpenLightbox } from '../../lib/lightbox'

export function MarkdownImage({
  src, alt = '', width, height, title, className, style, ...props
}: ComponentPropsWithoutRef<'img'>) {
  const openLightbox = useLightbox()
  const dimensions = width && height ? { aspectRatio: `${width} / ${height}` } : undefined

  return (
    <button
      type="button"
      onClick={() => src && openLightbox({ url: src, type: 'image', alt })}
      aria-label={alt ? `نمایش تصویر: ${alt}` : 'نمایش تصویر'}
      className="not-prose my-4 block max-w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--info)]"
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
        style={{ ...style, ...dimensions }}
        className={clsx('h-auto max-w-full', className)}
      />
    </button>
  )
}

export function MarkdownVideo({
  src, poster, title, onClick, className, ...props
}: ComponentPropsWithoutRef<'video'>) {
  const openLightbox = useLightbox()
  return (
    <video
      {...props}
      src={src}
      poster={poster}
      title={title}
      controls
      playsInline
      onClick={(event) => {
        onClick?.(event)
        if (src) openLightbox({ url: src, type: 'video' })
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