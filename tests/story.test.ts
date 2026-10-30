import { describe, expect, it } from 'vitest'
import { storyDayEnd, storyToday } from '../scripts/lib/story'
import { isStoryExpired, slideSeconds, type StoryData } from '../src/lib/story'

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
  it('keeps pictures at the base time and gives long text more', () => {
    expect(slideSeconds({ kind: 'image', src: 'a.jpg' }, 6)).toBe(6)
    expect(slideSeconds({ kind: 'text', caption: 'x'.repeat(280) }, 6)).toBe(18)
    expect(slideSeconds({ kind: 'text', caption: 'کوتاه' }, 6)).toBe(6)
  })
})
