/*
  Pure helpers for external embeds (iframes). No DOM APIs: this file is also
  imported by scripts/build-content.ts (Node) and by unit tests.
*/

export type EmbedProvider = 'youtube' | 'instagram' | 'aparat' | 'other'

const YOUTUBE_ID = /^[\w-]{11}$/

/** `90`, `90s`, `1m30s`, `1h2m3s`, `2m` → seconds. Returns undefined when invalid. */
export function parseStart(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined
  const text = value.trim().toLowerCase()
  if (/^\d+$/.test(text)) return Number(text)
  const match = text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || (!match[1] && !match[2] && !match[3])) return undefined
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function toUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/** Accepts a bare 11-char id or any watch / youtu.be / shorts / embed / live URL. */
export function parseYouTubeId(input: string | undefined | null): string | null {
  if (!input) return null
  const text = input.trim()
  if (YOUTUBE_ID.test(text)) return text
  const url = toUrl(text)
  if (!url || url.protocol !== 'https:') return null
  const host = url.hostname.replace(/^www\.|^m\./, '')
  let candidate: string | null = null
  if (host === 'youtu.be') {
    candidate = url.pathname.split('/')[1] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') candidate = url.searchParams.get('v')
    else {
      const [, kind, id] = url.pathname.split('/')
      if (['shorts', 'embed', 'live', 'v'].includes(kind)) candidate = id ?? null
    }
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null
}

/** Start time embedded in a YouTube URL (`t=` or `start=`), when present. */
export function parseYouTubeStartFromUrl(input: string | undefined | null): number | undefined {
  const url = input ? toUrl(input.trim()) : null
  if (!url) return undefined
  return parseStart(url.searchParams.get('t') ?? url.searchParams.get('start'))
}

export function youtubeEmbedUrl(id: string, start?: number): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
  if (start && start > 0) params.set('start', String(start))
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

export function youtubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export interface InstagramRef { kind: 'p' | 'reel' | 'tv'; code: string }

export function parseInstagram(input: string | undefined | null): InstagramRef | null {
  const url = input ? toUrl(input.trim()) : null
  if (!url || url.protocol !== 'https:') return null
  if (url.hostname.replace(/^www\./, '') !== 'instagram.com') return null
  const [, kind, code] = url.pathname.split('/')
  if ((kind === 'p' || kind === 'reel' || kind === 'tv') && code && /^[\w-]+$/.test(code)) {
    return { kind, code }
  }
  return null
}

export function instagramEmbedUrl(ref: InstagramRef): string {
  return `https://www.instagram.com/${ref.kind}/${ref.code}/embed`
}

export function aparatEmbedUrl(id: string): string | null {
  return /^[\w-]{3,32}$/.test(id) ? `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame` : null
}

/** Only https: sources and site-relative paths are allowed. Everything else is rejected. */
export function isSafeEmbedSrc(src: string | undefined | null): boolean {
  if (!src) return false
  const text = src.trim()
  if (text.startsWith('//')) return false
  if (text.startsWith('/') || text.startsWith('./')) return true
  const url = toUrl(text)
  return url !== null && url.protocol === 'https:'
}

export function isRelativeSrc(src: string): boolean {
  const text = src.trim()
  return (text.startsWith('/') && !text.startsWith('//')) || text.startsWith('./')
}

export function hostOf(src: string | undefined | null): string {
  const url = src ? toUrl(src.trim()) : null
  return url ? url.hostname : ''
}

export function detectProvider(src: string | undefined | null): EmbedProvider {
  if (!src) return 'other'
  if (parseYouTubeId(src) && src.includes('/') ) return 'youtube'
  if (parseInstagram(src)) return 'instagram'
  const host = hostOf(src).replace(/^www\./, '')
  if (host === 'aparat.com') return 'aparat'
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') return 'youtube'
  if (host === 'instagram.com') return 'instagram'
  return 'other'
}

/** True when `host` equals an allowlist entry or is a subdomain of it. */
export function isHostAllowed(host: string, allowlist: readonly string[]): boolean {
  const clean = host.toLowerCase()
  return allowlist.some((entry) => {
    const allowed = entry.toLowerCase().replace(/^www\./, '')
    return clean === allowed || clean === `www.${allowed}` || clean.endsWith(`.${allowed}`)
  })
}
