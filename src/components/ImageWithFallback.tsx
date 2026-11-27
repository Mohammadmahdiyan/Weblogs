import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { NoImage } from './NoImage'

type ImageWithFallbackProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackClassName?: string
}

/** Shows the site's SVG placeholder when an image URL is missing or fails to load. */
export function ImageWithFallback({
  src,
  alt = '',
  className = '',
  fallbackClassName = 'aspect-video w-full',
  onError,
  onLoad,
  ...props
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const image = useRef<HTMLImageElement>(null)

  const validSrc = typeof src === 'string' && src.trim().length > 0
  const failed = !validSrc || failedSrc === src

  // An image already in the browser's cache can be complete before React attaches `onLoad`.
  useEffect(() => {
    const element = image.current
    if (element?.complete && element.naturalWidth > 0) setLoadedSrc(String(src))
  }, [src])

  if (failed) {
    return <NoImage className={fallbackClassName} />
  }

  // While it loads, the box of the image shows a pale placeholder with a shimmer, so it is clear a picture goes here.
  const loading = loadedSrc !== String(src)

  return (
    <img
      // Many image hosts (CDNs, image-sharing sites) refuse requests that carry another site's address in the
      // Referer header ("hotlink protection"), which would show the placeholder. Sending no Referer fixes those hosts
      // and also keeps readers' visits private. A caller can still override it.
      referrerPolicy="no-referrer"
      {...props}
      ref={image}
      src={src}
      alt={alt}
      className={loading ? `${className} image-loading` : className}
      onLoad={(event) => {
        setLoadedSrc(String(src))
        onLoad?.(event)
      }}
      onError={(event) => {
        console.error('[Image load failed]', {
          src,
          resolvedUrl: event.currentTarget.src,
          page: window.location.href,
        })

        onError?.(event)
        setFailedSrc(String(src))
      }}
    />
  )
}