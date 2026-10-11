import { describe, expect, it } from 'vitest'
import {
  detectProvider,
  instagramEmbedUrl,
  isHostAllowed,
  isSafeEmbedSrc,
  parseInstagram,
  parseStart,
  parseYouTubeId,
  parseYouTubeStartFromUrl,
  youtubeEmbedUrl,
} from '../src/lib/embed.ts'

const ID = 'dQw4w9WgXcQ'

describe('parseYouTubeId', () => {
  it.each([
    [ID],
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}?t=30`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://m.youtube.com/watch?v=${ID}&feature=share`],
  ])('extracts the id from %s', (input) => {
    expect(parseYouTubeId(input)).toBe(ID)
  })

  it('rejects other hosts, http and garbage', () => {
    expect(parseYouTubeId('https://evil.example/watch?v=' + ID)).toBeNull()
    expect(parseYouTubeId(`http://youtu.be/${ID}`)).toBeNull()
    expect(parseYouTubeId('nope')).toBeNull()
    expect(parseYouTubeId('')).toBeNull()
  })
})

describe('parseStart', () => {
  it('accepts seconds and h/m/s notation', () => {
    expect(parseStart('90')).toBe(90)
    expect(parseStart('1m30s')).toBe(90)
    expect(parseStart('1h2m3s')).toBe(3723)
    expect(parseStart('2m')).toBe(120)
    expect(parseStart(45)).toBe(45)
  })

  it('rejects invalid values', () => {
    expect(parseStart('abc')).toBeUndefined()
    expect(parseStart('')).toBeUndefined()
    expect(parseStart(undefined)).toBeUndefined()
  })

  it('reads the start time from a YouTube URL', () => {
    expect(parseYouTubeStartFromUrl(`https://youtu.be/${ID}?t=1m5s`)).toBe(65)
    expect(parseYouTubeStartFromUrl(`https://www.youtube.com/watch?v=${ID}&start=12`)).toBe(12)
  })
})

describe('youtubeEmbedUrl', () => {
  it('uses the no-cookie domain and optional start', () => {
    expect(youtubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}?rel=0&modestbranding=1`)
    expect(youtubeEmbedUrl(ID, 90)).toContain('start=90')
  })
})

describe('instagram', () => {
  it.each([
    ['https://www.instagram.com/p/ABC123/', 'p'],
    ['https://www.instagram.com/reel/XyZ_9-/', 'reel'],
    ['https://instagram.com/tv/Code1/?utm=x', 'tv'],
  ])('parses %s', (url, kind) => {
    const ref = parseInstagram(url)
    expect(ref?.kind).toBe(kind)
    expect(instagramEmbedUrl(ref!)).toMatch(/^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]+\/embed$/)
  })

  it('rejects profiles, other hosts and http', () => {
    expect(parseInstagram('https://www.instagram.com/someuser/')).toBeNull()
    expect(parseInstagram('https://example.com/p/ABC/')).toBeNull()
    expect(parseInstagram('http://www.instagram.com/p/ABC/')).toBeNull()
  })
})

describe('isSafeEmbedSrc', () => {
  it('allows https and site-relative paths only', () => {
    expect(isSafeEmbedSrc('https://example.com/page')).toBe(true)
    expect(isSafeEmbedSrc('/content/a/file.html')).toBe(true)
    expect(isSafeEmbedSrc('./file.html')).toBe(true)
  })

  it('rejects dangerous or unsupported schemes', () => {
    expect(isSafeEmbedSrc('javascript:alert(1)')).toBe(false)
    expect(isSafeEmbedSrc('data:text/html,<b>x</b>')).toBe(false)
    expect(isSafeEmbedSrc('http://example.com')).toBe(false)
    expect(isSafeEmbedSrc('//example.com')).toBe(false)
    expect(isSafeEmbedSrc('about:blank')).toBe(false)
    expect(isSafeEmbedSrc('')).toBe(false)
  })
})

describe('detectProvider / isHostAllowed', () => {
  it('detects providers', () => {
    expect(detectProvider(`https://youtu.be/${ID}`)).toBe('youtube')
    expect(detectProvider('https://www.instagram.com/p/ABC/')).toBe('instagram')
    expect(detectProvider('https://www.aparat.com/video/video/embed/videohash/abc/vt/frame')).toBe('aparat')
    expect(detectProvider('https://example.com')).toBe('other')
  })

  it('matches hosts and subdomains against the allowlist', () => {
    expect(isHostAllowed('hadith.example.org', ['example.org'])).toBe(true)
    expect(isHostAllowed('example.org', ['example.org'])).toBe(true)
    expect(isHostAllowed('evilexample.org', ['example.org'])).toBe(false)
  })
})
