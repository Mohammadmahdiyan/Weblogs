import { describe, expect, it } from 'vitest'
import { articleHref, bodyOccurrence, findContentMatch, findContentMatches, parseOccurrence } from '../src/lib/contentSearch.ts'

describe('findContentMatch', () => {
  it('finds text through letter variants and ZWNJ, and returns the original wording', () => {
    const match = findContentMatch('کتاب سلیم بن قیس هلالی؛ علي می‌گوید', 'علی میگوید')
    expect(match?.match).toBe('علي می‌گوید')
  })

  it('puts the match in the middle: equal context on both sides', () => {
    const content = `${'الف '.repeat(60)}هدف${' ب'.repeat(80)}`
    const match = findContentMatch(content, 'هدف')
    expect(match?.match).toBe('هدف')
    expect(match?.before.replace('…', '').length).toBe(match?.after.replace('…', '').length)
  })

  it('has no context on the side where the text starts or ends', () => {
    const match = findContentMatch(`هدف ${'الف '.repeat(80)}`, 'هدف')
    expect(match?.before).toBe('')
    expect(match?.after).toBe('')
  })

  it('returns null when the text is not there', () => {
    expect(findContentMatch('سلام دنیا', 'وجود ندارد')).toBeNull()
  })
})

describe('articleHref', () => {
  it('links to the article, adding the text to jump to after a content search', () => {
    expect(articleHref('a')).toBe('/blog/a')
    expect(articleHref('a', ' سلیم بن قیس ')).toBe(`/blog/a?find=${encodeURIComponent('سلیم بن قیس')}`)
  })
})

describe('findContentMatches', () => {
  const content = `الف هدف ب ${'ج '.repeat(50)}هدف د ${'ه '.repeat(50)}هدف`

  it('returns every occurrence in reading order, each with its own context', () => {
    const matches = findContentMatches(content, 'هدف')
    expect(matches).toHaveLength(3)
    expect(matches.map((match) => match.match)).toEqual(['هدف', 'هدف', 'هدف'])
    expect(matches[0].start).toBeLessThan(matches[1].start)
    expect(matches[1].before.length).toBeGreaterThan(0)
    expect(matches[2].after).toBe('')
  })

  it('agrees with findContentMatch on the first one and is empty when nothing is found', () => {
    expect(findContentMatches(content, 'هدف')[0]).toEqual(findContentMatch(content, 'هدف'))
    expect(findContentMatches(content, 'نیست')).toEqual([])
  })
})

describe('occurrence in the link', () => {
  it('adds the 1-based occurrence only after the first one', () => {
    expect(articleHref('a', 'x', 0)).toBe('/blog/a?find=x')
    expect(articleHref('a', 'x', 2)).toBe('/blog/a?find=x&n=3')
    expect(parseOccurrence('3')).toBe(2)
    expect(parseOccurrence(null)).toBe(0)
    expect(parseOccurrence('abc')).toBe(0)
  })

  it('does not count hits inside the title (it is not part of the rendered body)', () => {
    const matches = findContentMatches('هدف عنوان. متن هدف و باز هدف', 'هدف')
    expect(bodyOccurrence(matches, 0, 'هدف عنوان'.length)).toBe(0)
    expect(bodyOccurrence(matches, 2, 'هدف عنوان'.length)).toBe(1)
  })
})
