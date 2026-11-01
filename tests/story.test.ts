import { describe, expect, it } from 'vitest'
import { normalizeKey, parseSections, resolveSectionLink, storyDayEnd, storyToday, type ArticleSource } from '../scripts/lib/story.ts'
import { isStoryExpired, slideSeconds, type StoryData } from '../src/lib/story.ts'

describe('story dates', () => {
  it('ends the story day at midnight in Tehran (+03:30)', () => {
    expect(storyDayEnd('2026-10-30')).toBe('2026-10-30T20:30:00.000Z')
  })

  it('uses the Tehran calendar day, not the machine zone', () => {
    expect(storyToday(new Date('2026-10-30T20:29:00Z'))).toBe('2026-10-30')
    expect(storyToday(new Date('2026-10-30T20:31:00Z'))).toBe('2026-10-31')
  })

  it('expires exactly at the end of the day', () => {
    const story = { expiresAt: '2026-10-30T20:30:00.000Z' } as StoryData
    expect(isStoryExpired(story, Date.parse('2026-10-30T20:29:59Z'))).toBe(false)
    expect(isStoryExpired(story, Date.parse('2026-10-30T20:30:00Z'))).toBe(true)
  })
})

describe('slideSeconds', () => {
  it('keeps short stories at the base time and gives long text more, up to a minute', () => {
    expect(slideSeconds({ kind: 'image', src: 'a.jpg', textLength: 0 }, 6)).toBe(6)
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 300 }, 6)).toBe(20)
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 90000 }, 6)).toBe(60)
  })

  it('lets a story file choose its own time', () => {
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 3000, seconds: 12 }, 6)).toBe(12)
  })
})

const plain = (markdown: string) => markdown.replace(/[#*>|]/g, ' ').replace(/\s+/g, ' ').trim()
const article = {
  meta: { slug: 'eid', title: 'غدیر ، عید سیاسی' },
  body: 'مقدمه\n\n## بخش یک\n\nمتن یک\n\n### زیر بخش\n\nمتن زیر\n\n## شاید بگویند\n\nمتن دو\n\n```\n## داخل کد\n```\n',
} as unknown as ArticleSource

describe('story section links', () => {
  it('splits an article at its ##–#### headings, skipping code fences', () => {
    const sections = parseSections(article.body, plain)
    expect(sections.map((section) => [section.level, section.heading])).toEqual([[2, 'بخش یک'], [3, 'زیر بخش'], [2, 'شاید بگویند']])
    expect(sections[0].markdown).toContain('متن زیر')
    expect(sections[2].markdown).toContain('## داخل کد')
  })

  it('finds `article / section` by title or folder name, ignoring ZWNJ and Arabic letter variants', () => {
    expect(resolveSectionLink('غدیر ، عید سیاسی/شاید بگویند', [article], plain, 'x')?.section.heading).toBe('شاید بگویند')
    expect(resolveSectionLink('eid / شايد بگويند', [article], plain, 'x')?.section.heading).toBe('شاید بگویند')
  })

  it('is not a link when no article matches, and explains a missing section', () => {
    expect(resolveSectionLink('و/یا', [article], plain, 'x')).toBeNull()
    expect(() => resolveSectionLink('eid/ناموجود', [article], plain, 'story/a.md')).toThrow(/Sections you can use/)
  })

  it('normalizes text for comparison', () => {
    expect(normalizeKey('  شايد‌ بگويند؟ ')).toBe(normalizeKey('شاید بگویند'))
  })
})
