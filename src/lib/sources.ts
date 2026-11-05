/**
 * Sources of an article, written in its frontmatter:
 *
 *   sources:
 *     - https://www.youtube.com/watch?v=abc
 *     - https://t.me/channel/123
 *     - ویدیو آموزش | https://example.com/page        (own title | address)
 *     - کتاب فلان، جلد ۲، صفحهٔ ۴۰                      (plain text, no link)
 *     - { url: https://example.com/a.jpg, title: عکس سند }
 *
 * The article shows them at its end in an accordion, each with what kind of source it is («ویدیو یوتیوب»…).
 */

export interface SourceItem {
  /** http(s) or tg:// address. Missing = a plain-text source (a book, a page number…). */
  url?: string
  title?: string
}

export type SourceKind = 'youtube' | 'aparat' | 'telegram' | 'instagram' | 'twitter' | 'wikipedia' | 'github' | 'archive' | 'image' | 'video' | 'audio' | 'pdf' | 'website' | 'text'

export interface SourceInfo {
  kind: SourceKind
  /** «ویدیو یوتیوب», «پست تلگرام», «عکس», «وب‌سایت»… */
  label: string
  /** Host without `www.` (links only). */
  host?: string
}

const LINK = /^(?:https?:\/\/|tg:\/\/)\S+$/i
const TITLE_AND_LINK = /^(.+?)\s*\|\s*((?:https?:\/\/|tg:\/\/)\S+)$/i

function one(value: unknown, label: string): SourceItem {
  if (typeof value === 'string') {
    const text = value.trim()
    const pair = text.match(TITLE_AND_LINK)
    if (pair) return { url: pair[2], title: pair[1].trim() }
    return LINK.test(text) ? { url: text } : { title: text }
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const url = record.url ?? record.link ?? record['آدرس']
    const title = record.title ?? record['عنوان']
    if (url !== undefined && (typeof url !== 'string' || !LINK.test(url.trim()))) {
      throw new Error(`${label}: a source "url" must be a full address starting with https:// (or http://, tg://)`)
    }
    if (title !== undefined && typeof title !== 'string') throw new Error(`${label}: a source "title" must be text`)
    const cleanTitle = typeof title === 'string' ? title.trim() : ''
    const cleanUrl = typeof url === 'string' ? url.trim() : ''
    if (!cleanUrl && !cleanTitle) throw new Error(`${label}: a source needs a "url" or a "title"`)
    return { ...(cleanUrl ? { url: cleanUrl } : {}), ...(cleanTitle ? { title: cleanTitle } : {}) }
  }
  throw new Error(`${label}: each source must be an address, a text, or { url, title }`)
}

/** Frontmatter value → clean list (duplicates and empty entries removed). Throws a readable error for a wrong shape. */
export function normalizeSources(value: unknown, label: string): SourceItem[] {
  if (value === undefined || value === null || value === '') return []
  const list = Array.isArray(value) ? value : [value]
  const items = list.map((entry) => one(entry, label)).filter((item) => item.url || item.title)
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url ?? item.title ?? ''
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const IMAGE_FILE = /\.(?:jpe?g|png|webp|gif|avif|svg)$/i
const VIDEO_FILE = /\.(?:mp4|webm|mov|m4v|ogv)$/i
const AUDIO_FILE = /\.(?:mp3|ogg|oga|wav|m4a|aac|opus|flac)$/i

/** What kind of source this is, from its address. */
export function classifySource(item: SourceItem): SourceInfo {
  if (!item.url) return { kind: 'text', label: 'منبع' }
  if (/^tg:/i.test(item.url)) return { kind: 'telegram', label: 'تلگرام' }

  let url: URL
  try {
    url = new URL(item.url)
  } catch {
    return { kind: 'website', label: 'وب‌سایت' }
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const path = url.pathname
  const is = (...domains: string[]) => domains.some((domain) => host === domain || host.endsWith(`.${domain}`))

  if (is('youtube.com', 'youtu.be', 'youtube-nocookie.com')) {
    if (/^\/(?:@|channel\/|c\/|user\/)/.test(path)) return { kind: 'youtube', label: 'کانال یوتیوب', host }
    if (path.startsWith('/playlist')) return { kind: 'youtube', label: 'پلی‌لیست یوتیوب', host }
    return { kind: 'youtube', label: 'ویدیو یوتیوب', host }
  }
  if (is('aparat.com')) return { kind: 'aparat', label: 'ویدیو آپارات', host }
  if (is('t.me', 'telegram.me', 'telegram.dog', 'telesco.pe')) {
    return { kind: 'telegram', label: /\/\d+\/?$/.test(path) ? 'پست تلگرام' : 'تلگرام', host }
  }
  if (is('instagram.com')) return { kind: 'instagram', label: 'اینستاگرام', host }
  if (is('twitter.com', 'x.com')) return { kind: 'twitter', label: 'توییتر (X)', host }
  if (is('wikipedia.org')) return { kind: 'wikipedia', label: 'ویکی‌پدیا', host }
  if (is('github.com')) return { kind: 'github', label: 'گیت‌هاب', host }
  if (is('archive.org')) return { kind: 'archive', label: 'آرشیو اینترنت', host }
  if (IMAGE_FILE.test(path)) return { kind: 'image', label: 'عکس', host }
  if (VIDEO_FILE.test(path)) return { kind: 'video', label: 'ویدیو', host }
  if (AUDIO_FILE.test(path)) return { kind: 'audio', label: 'صوت', host }
  if (/\.pdf$/i.test(path)) return { kind: 'pdf', label: 'فایل PDF', host }
  return { kind: 'website', label: 'وب‌سایت', host }
}

/** The words shown for a source: its own title, else the address without `https://www.`, shortened. */
export function sourceText(item: SourceItem, maxLength = 56): string {
  if (item.title) return item.title
  const shown = (item.url ?? '').replace(/^(?:https?:\/\/)(?:www\.)?/i, '').replace(/\/$/, '')
  return shown.length > maxLength ? `${shown.slice(0, maxLength - 1)}…` : shown
}
