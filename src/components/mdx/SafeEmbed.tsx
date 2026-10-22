import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Expand, Play, X } from 'lucide-react'
import { clsx } from 'clsx'
import siteConfig from '../../site.config'
import {
  aparatEmbedUrl,
  detectProvider,
  hostOf,
  instagramEmbedUrl,
  isHostAllowed,
  isRelativeSrc,
  isSafeEmbedSrc,
  parseInstagram,
  parseStart,
  parseYouTubeId,
  parseYouTubeStartFromUrl,
  youtubeEmbedUrl,
  youtubePoster,
  type EmbedProvider,
} from '../../lib/embed'

type Flag = boolean | string | undefined

export interface SafeEmbedProps {
  /** Set automatically by the markdown pipeline: embed | youtube | instagram | aparat. */
  directiveName?: string
  src?: string
  url?: string
  id?: string
  title?: string
  ratio?: string
  height?: string
  width?: string
  caption?: string
  /** Original page to link to in the fallback bar (defaults to the embed URL). */
  source?: string
  start?: string
  allowScroll?: Flag
  allowForms?: Flag
  facade?: Flag
  fallbackOnly?: Flag
}

interface ResolvedEmbed {
  provider: EmbedProvider
  iframeSrc: string
  sourceUrl: string
  poster?: string
  ratio: string
  minHeight?: number
  isVideo: boolean
  needsFacade: boolean
}

const LOAD_TIMEOUT_MS = 8000

function flag(value: Flag): boolean {
  return value === true || value === '' || value === 'true'
}

function cleanRatio(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const text = value.trim().replace(':', '/')
  return /^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(text) ? text : fallback
}

function cleanHeight(value: string | undefined): string | undefined {
  if (!value) return undefined
  const text = value.trim()
  if (/^\d+(\.\d+)?$/.test(text)) return `${text}px`
  return /^\d+(\.\d+)?(px|vh|rem)$/.test(text) ? text : undefined
}

function resolveEmbed(props: SafeEmbedProps): ResolvedEmbed | null {
  const raw = props.src ?? props.url
  const directive = props.directiveName
  const provider: EmbedProvider = directive === 'youtube' || directive === 'instagram' || directive === 'aparat'
    ? directive
    : detectProvider(raw)
  const ratio = cleanRatio(props.ratio, '16/9')
  const facade = flag(props.facade)

  if (provider === 'youtube') {
    const id = parseYouTubeId(props.id ?? raw)
    if (!id) return null
    const start = parseStart(props.start) ?? parseYouTubeStartFromUrl(raw)
    return {
      provider, iframeSrc: youtubeEmbedUrl(id, start), sourceUrl: `https://www.youtube.com/watch?v=${id}`,
      poster: youtubePoster(id), ratio, isVideo: true, needsFacade: true,
    }
  }

  if (provider === 'instagram') {
    const ref = parseInstagram(raw)
    if (!ref) return null
    return {
      provider, iframeSrc: instagramEmbedUrl(ref), sourceUrl: `https://www.instagram.com/${ref.kind}/${ref.code}/`,
      ratio: cleanRatio(props.ratio, '4/5'), minHeight: 480, isVideo: false, needsFacade: true,
    }
  }

  if (provider === 'aparat') {
    const iframeSrc = props.id ? aparatEmbedUrl(props.id) : raw && isSafeEmbedSrc(raw) ? raw : null
    if (!iframeSrc) return null
    return {
      provider, iframeSrc, sourceUrl: props.id ? `https://www.aparat.com/v/${props.id}` : iframeSrc,
      ratio, isVideo: true, needsFacade: true,
    }
  }

  if (!raw || !isSafeEmbedSrc(raw)) return null
  return { provider: 'other', iframeSrc: raw.trim(), sourceUrl: props.source ?? raw.trim(), ratio, isVideo: false, needsFacade: facade }
}

function buildSandbox(iframeSrc: string, allowForms: boolean): string {
  const flags = ['allow-scripts', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-presentation']
  // allow-scripts + allow-same-origin on a same-origin page would let it remove its own sandbox.
  if (!isRelativeSrc(iframeSrc)) flags.push('allow-same-origin')
  if (allowForms) flags.push('allow-forms')
  return flags.join(' ')
}

const providerLabel: Record<EmbedProvider, string> = {
  youtube: 'یوتیوب', instagram: 'اینستاگرام', aparat: 'آپارات', other: '',
}

function SourceLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={clsx('inline-flex items-center gap-1 font-semibold text-[var(--info)] no-underline', className)}>
      {children}
      <ArrowRight aria-hidden="true" className="size-3.5 rtl:rotate-180" />
    </a>
  )
}

function ExpandDialog({ src, title, allow, sandbox, onClose }: { src: string; title: string; allow?: string; sandbox: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close() }}
      className="m-auto h-[min(88vh,56rem)] w-[min(96vw,80rem)] rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--surface)] p-0 text-[var(--text)] backdrop:bg-black/70"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-light)] px-4 py-2">
          <span className="truncate text-sm font-semibold">{title}</span>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="بستن" className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--surface-alt)]">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={sandbox}
          allow={allow}
          allowFullScreen={allow !== undefined}
          className="min-h-0 flex-1 border-0"
        />
      </div>
    </dialog>
  )
}

function EmbedFrame({ props, resolved }: { props: SafeEmbedProps; resolved: ResolvedEmbed }) {
  const figureRef = useRef<HTMLElement>(null)
  const [activated, setActivated] = useState(false)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)

  const fallbackOnly = flag(props.fallbackOnly)
  const host = hostOf(resolved.iframeSrc) || hostOf(resolved.sourceUrl) || 'سایت میزبان'
  const relative = isRelativeSrc(resolved.iframeSrc)
  const allowed = relative || resolved.provider !== 'other' || isHostAllowed(host, siteConfig.embedAllowlist)
  const title = props.title || props.caption || host
  const sandbox = buildSandbox(resolved.iframeSrc, flag(props.allowForms))
  const allow = resolved.isVideo ? 'fullscreen; picture-in-picture; encrypted-media' : undefined
  const mount = !fallbackOnly && !timedOut && (resolved.needsFacade ? activated : inView)
  const fixedHeight = cleanHeight(props.height)

  useEffect(() => {
    if (!allowed && import.meta.env.DEV) {
      console.info(`[embed] "${host}" is not in site.config.ts → embedAllowlist. It still renders, with an external-content notice.`)
    }
  }, [allowed, host])

  useEffect(() => {
    if (resolved.needsFacade || fallbackOnly || inView) return
    const element = figureRef.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [resolved.needsFacade, fallbackOnly, inView])

  // Browsers do not report X-Frame-Options / frame-ancestors failures, so this is a best-effort timeout.
  useEffect(() => {
    if (!mount || loaded) return
    const timer = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [mount, loaded])

  const boxStyle = fixedHeight
    ? { height: fixedHeight }
    : { aspectRatio: resolved.ratio, minHeight: resolved.minHeight }
  const showFallbackCard = fallbackOnly || timedOut
  const facadeLabel = resolved.isVideo ? `پخش ویدیو: ${title}` : `نمایش محتوا: ${title}`

  return (
    <figure ref={figureRef} className="not-prose my-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--surface-alt)] text-[var(--text)]">
      {!allowed && (
        <div role="note" className="border-b border-[var(--border-light)] bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] px-4 py-2 text-start text-xs text-[var(--text)]">
          محتوای خارجی · {host}
        </div>
      )}

      <div className="relative w-full" style={boxStyle}>
        {showFallbackCard ? (
          <div className="grid size-full min-h-48 place-content-center justify-items-center gap-3 p-6 text-center">
            <p className="m-0 text-base font-bold">{title}</p>
            <p className="m-0 text-sm text-[var(--text-secondary)]">
              {fallbackOnly ? 'این منبع فقط از طریق پیوند قابل مشاهده است.' : 'نمایش این منبع در کادر ممکن نشد؛ ممکن است سایت مبدأ اجازهٔ نمایش در صفحات دیگر را نداده باشد.'}
            </p>
            <p dir="ltr" className="m-0 text-xs text-[var(--muted)]">{host}</p>
            <a href={resolved.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline">
              مشاهده در منبع
              <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
            </a>
          </div>
        ) : mount ? (
          <>
            <iframe
              title={title}
              src={resolved.iframeSrc}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox={sandbox}
              allow={allow}
              allowFullScreen={allow !== undefined}
              scrolling={flag(props.allowScroll) ? 'yes' : undefined}
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 size-full border-0"
            />
            {!loaded && <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--surface-alt)]"><div className="loader-ring" /></div>}
            {loaded && (
              <button type="button" onClick={() => setExpanded(true)} aria-label="نمایش بزرگ‌تر" title="نمایش بزرگ‌تر" className="absolute end-2 top-2 inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white">
                <Expand aria-hidden="true" className="size-4" />
              </button>
            )}
          </>
        ) : resolved.needsFacade ? (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={facadeLabel}
            className="embed-facade group relative grid size-full cursor-pointer place-items-center overflow-hidden border-0 text-white"
            style={{ background: 'linear-gradient(135deg, var(--surface-strong), var(--surface-alt))' }}
          >
            {resolved.poster && siteConfig.embedPoster && !posterFailed && (
              <img src={resolved.poster} alt="" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} className="absolute inset-0 size-full object-cover" />
            )}
            <span className="embed-facade-play relative z-10 grid size-16 place-items-center rounded-full bg-[var(--brand)] text-[var(--brand-contrast)] shadow-lg">
              <Play aria-hidden="true" className="size-7" />
            </span>
            <span className="absolute inset-x-0 bottom-0 z-10 truncate bg-black/65 px-4 py-2 text-start text-sm">
              {providerLabel[resolved.provider] && `${providerLabel[resolved.provider]} · `}{title}
            </span>
          </button>
        ) : (
          <div aria-hidden="true" className="size-full animate-pulse bg-[var(--surface-strong)]" />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-light)] px-4 py-2 text-xs text-[var(--text-secondary)]">
        <span dir="ltr" className="truncate">{providerLabel[resolved.provider] || host}</span>
        <span className="flex flex-wrap items-center gap-3">
          {!showFallbackCard && <span>نمایش نشد؟</span>}
          <SourceLink href={resolved.sourceUrl}>مشاهده در منبع</SourceLink>
        </span>
      </div>

      {props.caption && <figcaption className="border-t border-[var(--border-light)] px-4 py-2 text-start text-sm text-[var(--text-secondary)]">{props.caption}</figcaption>}
      {expanded && <ExpandDialog src={resolved.iframeSrc} title={title} allow={allow} sandbox={sandbox} onClose={() => setExpanded(false)} />}
    </figure>
  )
}

export function SafeEmbed(props: SafeEmbedProps) {
  const resolved = resolveEmbed(props)

  if (!resolved) {
    if (!import.meta.env.DEV) return null
    return (
      <div role="note" className="not-prose my-3 border border-dashed border-[var(--warn)] p-3 text-sm text-[var(--text)]">
        منبع embed نامعتبر است (فقط https یا مسیر نسبی مجاز است): <code>{props.src ?? props.url ?? props.id ?? '—'}</code>
      </div>
    )
  }
  return <EmbedFrame props={props} resolved={resolved} />
}

/** Raw `<iframe>` found in markdown / HTML is rewritten to SafeEmbed by the component map. */
export function RawIframe({ src, title, width, height }: { src?: string; title?: string; width?: string | number; height?: string | number }) {
  const widthNumber = Number(width)
  const heightNumber = Number(height)
  const ratio = widthNumber > 0 && heightNumber > 0 ? `${widthNumber}/${heightNumber}` : undefined
  return <SafeEmbed src={src} title={title} ratio={ratio} />
}
