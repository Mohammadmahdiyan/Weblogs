import { describe, expect, it } from 'vitest'
import { parseTimestamp, parseVideoHash, videoLinkHash } from '../src/lib/videoLink.ts'
import { youtubeEmbedUrl } from '../src/lib/embed.ts'

describe('parseTimestamp', () => {
  it('reads seconds, 1m30s style and clock style', () => {
    expect(parseTimestamp('90')).toBe(90)
    expect(parseTimestamp('1m30s')).toBe(90)
    expect(parseTimestamp('1h2m3s')).toBe(3723)
    expect(parseTimestamp('2:30')).toBe(150)
    expect(parseTimestamp('1:02:03')).toBe(3723)
  })

  it('rejects anything else', () => {
    expect(parseTimestamp('')).toBeUndefined()
    expect(parseTimestamp('abc')).toBeUndefined()
    expect(parseTimestamp('1:75')).toBeUndefined()
    expect(parseTimestamp('1:99:00')).toBeUndefined()
  })
})

describe('parseVideoHash', () => {
  it('points at the first video unless v is given', () => {
    expect(parseVideoHash('#t=2m30s')).toEqual({ seconds: 150, index: 0 })
    expect(parseVideoHash('t=90')).toEqual({ seconds: 90, index: 0 })
  })

  it('counts videos from 1', () => {
    expect(parseVideoHash('#t=2:30&v=2')).toEqual({ seconds: 150, index: 1 })
    expect(parseVideoHash('#v=3&t=10')).toEqual({ seconds: 10, index: 2 })
  })

  it('reads a percent-encoded fragment', () => {
    expect(parseVideoHash('#t%3D1%3A30%26v%3D2')).toEqual({ seconds: 90, index: 1 })
  })

  it('is not fooled by headings or bad values', () => {
    expect(parseVideoHash('#دلیل-پاسخ')).toBeNull()
    expect(parseVideoHash('#t=abc')).toBeNull()
    expect(parseVideoHash('#t=10&v=0')).toBeNull()
    expect(parseVideoHash('#t=10&v=x')).toBeNull()
    expect(parseVideoHash('')).toBeNull()
  })
})

describe('videoLinkHash', () => {
  it('writes the fragment back', () => {
    expect(videoLinkHash(150)).toBe('#t=150')
    expect(videoLinkHash(150, 2)).toBe('#t=150&v=2')
  })
})

describe('youtubeEmbedUrl for a moment link', () => {
  it('starts at the moment and plays at once', () => {
    const url = youtubeEmbedUrl('dQw4w9WgXcQ', 150, true)
    expect(url).toContain('start=150')
    expect(url).toContain('autoplay=1')
  })
})
