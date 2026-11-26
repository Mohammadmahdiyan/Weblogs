import { parseStart } from './embed.ts'

/**
 * A link to a moment of a video, written as a page fragment:
 *
 *   #t=2m30s            the first video of the page, from 2:30
 *   #t=2:30&v=2         the second video of the page, from 2:30
 *   /media/x/y#t=90     the first video of another article, from 1:30
 *
 * `t` accepts seconds (`90`), `1m30s`, `1h2m3s` or a clock (`2:30`, `1:02:03`). `v` counts the videos of the
 * article body in the order they appear (files and YouTube alike), starting at 1. No `v` means the first one.
 */

/** Pure helpers (no DOM): also used by `npm run checkLinks`. */
export interface VideoLink {
  seconds: number
  /** 0-based position among the videos of the article body. */
  index: number
}

/** `90`, `1m30s`, `1h2m3s`, `2:30`, `1:02:03` → seconds; undefined when it is none of these. */
export function parseTimestamp(value: string | undefined | null): number | undefined {
  if (!value) return undefined
  const text = value.trim()
  const clock = text.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})$/)
  if (clock) {
    const [, hours, minutes, seconds] = clock
    if (Number(seconds) > 59 || (hours !== undefined && Number(minutes) > 59)) return undefined
    return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds)
  }
  return parseStart(text)
}

/** The video a fragment points at (`#t=…&v=…`, with or without the `#`), or null when it is not a video link. */
export function parseVideoHash(hash: string | undefined | null): VideoLink | null {
  if (!hash) return null
  let text = hash.startsWith('#') ? hash.slice(1) : hash
  try {
    text = decodeURIComponent(text)
  } catch {
    // Keep the literal text; it will most likely not parse.
  }
  const values = new Map<string, string>()
  for (const part of text.split(/[&;]/)) {
    const separator = part.indexOf('=')
    if (separator > 0) values.set(part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim())
  }
  const seconds = parseTimestamp(values.get('t') ?? values.get('time'))
  if (seconds === undefined) return null
  const rawVideo = values.get('v') ?? values.get('video')
  if (rawVideo === undefined) return { seconds, index: 0 }
  if (!/^\d+$/.test(rawVideo) || Number(rawVideo) < 1) return null
  return { seconds, index: Number(rawVideo) - 1 }
}

/** The fragment for a moment of a video (`videoNumber` counts from 1; the first video needs no `v`). */
export function videoLinkHash(seconds: number, videoNumber = 1): string {
  return `#t=${Math.max(0, Math.floor(seconds))}${videoNumber > 1 ? `&v=${Math.floor(videoNumber)}` : ''}`
}
