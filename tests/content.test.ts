import { describe, expect, it } from 'vitest'
import { rewriteMediaUrl, type MediaFile } from '../scripts/lib/media.ts'
import { validateCoverEmbed, validateDir, validateLang } from '../scripts/lib/validators.ts'

const media: MediaFile[] = [{ sourcePath: '/x/pic.png', relativePath: 'pic.png', type: 'image' }]

describe('rewriteMediaUrl', () => {
  it('rewrites relative media paths to /content/<slug>/…', () => {
    expect(rewriteMediaUrl('./pic.png', 'my-slug', media)).toBe('/content/my-slug/pic.png')
    expect(rewriteMediaUrl('pic.png?x=1', 'my-slug', media)).toBe('/content/my-slug/pic.png?x=1')
  })

  it('leaves absolute URLs and unknown non-media paths untouched', () => {
    expect(rewriteMediaUrl('https://example.com/a.png', 's', media)).toBe('https://example.com/a.png')
    expect(rewriteMediaUrl('data:image/png;base64,AAA', 's', media)).toBe('data:image/png;base64,AAA')
    expect(rewriteMediaUrl('/already/absolute.png', 's', media)).toBe('/already/absolute.png')
    expect(rewriteMediaUrl('notes', 's', media)).toBe('notes')
  })
})

describe('frontmatter validators', () => {
  it('coverEmbed: accepts https, rejects http / empty / non-strings', () => {
    expect(validateCoverEmbed('https://youtu.be/dQw4w9WgXcQ', 'a.md')).toBe('https://youtu.be/dQw4w9WgXcQ')
    expect(validateCoverEmbed(undefined, 'a.md')).toBeUndefined()
    expect(() => validateCoverEmbed('http://example.com', 'a.md')).toThrow(/a\.md/)
    expect(() => validateCoverEmbed('', 'a.md')).toThrow()
    expect(() => validateCoverEmbed(5, 'a.md')).toThrow()
  })

  it('lang and dir', () => {
    expect(validateLang('ar', 'a.md')).toBe('ar')
    expect(() => validateLang('persian!', 'a.md')).toThrow()
    expect(validateDir('ltr', 'a.md')).toBe('ltr')
    expect(() => validateDir('up', 'a.md')).toThrow()
  })
})
