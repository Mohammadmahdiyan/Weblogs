import { describe, expect, it } from 'vitest'
import { classifySource, normalizeSources, sourceText } from '../src/lib/sources.ts'

describe('normalizeSources', () => {
  it('reads one value or a list; addresses become links, other text stays text', () => {
    expect(normalizeSources('https://youtu.be/abc', 'x.md')).toEqual([{ url: 'https://youtu.be/abc' }])
    expect(normalizeSources(['https://t.me/c/1', 'کتاب فلان، صفحهٔ ۴۰'], 'x.md')).toEqual([{ url: 'https://t.me/c/1' }, { title: 'کتاب فلان، صفحهٔ ۴۰' }])
  })

  it('accepts «title | address» and { url, title }', () => {
    expect(normalizeSources('ویدیو آموزش | https://example.com/a', 'x.md')).toEqual([{ url: 'https://example.com/a', title: 'ویدیو آموزش' }])
    expect(normalizeSources([{ url: 'https://example.com/a.jpg', title: 'عکس سند' }], 'x.md')).toEqual([{ url: 'https://example.com/a.jpg', title: 'عکس سند' }])
  })

  it('never makes a link out of a dangerous scheme', () => {
    expect(normalizeSources('javascript:alert(1)', 'x.md')).toEqual([{ title: 'javascript:alert(1)' }])
    expect(() => normalizeSources([{ url: 'javascript:alert(1)' }], 'x.md')).toThrow(/x\.md.*https/)
  })

  it('drops empties and duplicates and explains a wrong shape', () => {
    expect(normalizeSources(['https://a.com', 'https://a.com', '  '], 'x.md')).toEqual([{ url: 'https://a.com' }])
    expect(normalizeSources(undefined, 'x.md')).toEqual([])
    expect(() => normalizeSources([42], 'x.md')).toThrow(/x\.md/)
    expect(() => normalizeSources([{}], 'x.md')).toThrow(/url.*title/)
  })
})

describe('classifySource', () => {
  const label = (url: string) => classifySource({ url }).label

  it('names the kind of source', () => {
    expect(label('https://www.youtube.com/watch?v=abc')).toBe('ویدیو یوتیوب')
    expect(label('https://youtu.be/abc')).toBe('ویدیو یوتیوب')
    expect(label('https://www.youtube.com/@name')).toBe('کانال یوتیوب')
    expect(label('https://t.me/channel/123')).toBe('پست تلگرام')
    expect(label('https://t.me/channel')).toBe('تلگرام')
    expect(label('https://www.aparat.com/v/abc')).toBe('ویدیو آپارات')
    expect(label('https://fa.wikipedia.org/wiki/x')).toBe('ویکی‌پدیا')
    expect(label('https://example.com/pic.JPG?x=1')).toBe('عکس')
    expect(label('https://example.com/clip.mp4')).toBe('ویدیو')
    expect(label('https://example.com/book.pdf')).toBe('فایل PDF')
    expect(label('https://example.com/page')).toBe('وب‌سایت')
    expect(classifySource({ title: 'کتاب' }).kind).toBe('text')
  })

  it('does not mistake a look-alike domain for the real one', () => {
    expect(label('https://notyoutube.com/watch')).toBe('وب‌سایت')
    expect(label('https://youtube.com.evil.example/x')).toBe('وب‌سایت')
  })
})

describe('sourceText', () => {
  it('shows the title, else the shortened address', () => {
    expect(sourceText({ url: 'https://www.example.com/a/', title: 'عنوان' })).toBe('عنوان')
    expect(sourceText({ url: 'https://www.example.com/a/' })).toBe('example.com/a')
    expect(sourceText({ url: `https://example.com/${'x'.repeat(100)}` }, 20)).toHaveLength(20)
  })
})
