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
  const [failed, setFailed] = useState(false)

  if (typeof src !== 'string' || !src.trim() || failed) {
    return <NoImage className={fallbackClassName} />
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        onError?.(event)
        setFailed(true)
      }}
    />
  )
}
