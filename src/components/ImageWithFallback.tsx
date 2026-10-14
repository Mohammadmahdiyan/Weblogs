import { useState, type ImgHTMLAttributes } from 'react'
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
  ...props
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const validSrc = typeof src === 'string' && src.trim().length > 0
  const failed = !validSrc || failedSrc === src

  if (failed) {
    return <NoImage className={fallbackClassName} />
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
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