import { useEffect, useId, useRef, useState } from 'react'
import type { ArticleMeta } from '../lib/types'
import { useLightbox, useLightboxRegistration } from '../lib/lightbox'
import { AudioPlayer } from './AudioPlayer'
import { SafeEmbed } from './mdx/SafeEmbed'

interface CoverMediaProps {
  cover: ArticleMeta['cover']
  title: string
}

const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']

export function CoverMedia({ cover, title }: CoverMediaProps) {
  const openLightbox = useLightbox()
  const registerMedia = useLightboxRegistration()
  const id = useId()
  const videoElementRef = useRef<HTMLDivElement>(null)
  const imageElementRef = useRef<HTMLButtonElement>(null)
  const [posters, setPosters] = useState<Record<string, string>>({})
  const poster = cover ? posters[cover.url] : undefined

  useEffect(() => {
    if (!cover || cover.type !== 'video') return
    const stem = cover.url.replace(/\.[^./?#]+(?=[?#]|$)/, '')
    let cancelled = false
    let candidateIndex = 0
    const probe = new Image()

    const tryNextImage = () => {
      if (cancelled || candidateIndex >= imageExtensions.length) return
      probe.src = `${stem}.${imageExtensions[candidateIndex++]}`
    }

    probe.onload = () => {
      if (!cancelled) setPosters((current) => ({ ...current, [cover.url]: probe.src }))
    }
    probe.onerror = tryNextImage
    tryNextImage()
    return () => {
      cancelled = true
      probe.onload = null
      probe.onerror = null
    }
  }, [cover])

  useEffect(() => {
    if (!cover || cover.type === 'audio' || cover.type === 'embed') return
    const element = videoElementRef.current ?? imageElementRef.current
    return registerMedia(id, { url: cover.url, type: cover.type, alt: title, title }, element)
  }, [cover, id, registerMedia, title])

  if (!cover) return null
  if (cover.type === 'audio') return <AudioPlayer src={cover.url} title={title} />
  // Embed covers (YouTube / Instagram / …) show the click-to-load facade first.
  if (cover.type === 'embed') return <SafeEmbed src={cover.url} title={title} />

  if (cover.type === 'video') {
    return (
      <div ref={videoElementRef} className="not-prose my-5 aspect-video overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-alt)]">
        <video
          src={cover.url}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          onClick={() => openLightbox({ url: cover.url, type: 'video', alt: title, title })}
          className="size-full cursor-zoom-in object-contain"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      ref={imageElementRef}
      onClick={() => openLightbox({ url: cover.url, type: 'image', alt: title, title })}
      aria-label={`نمایش تصویر اصلی: ${title}`}
      className="not-prose my-5 block aspect-video w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--info)]"
    >
      <img
        ref={(element) => element?.setAttribute('fetchpriority', 'high')}
        src={cover.url}
        alt={title}
        width="1280"
        height="720"
        loading="eager"
        decoding="async"
        className="size-full object-contain"
      />
    </button>
  )
}