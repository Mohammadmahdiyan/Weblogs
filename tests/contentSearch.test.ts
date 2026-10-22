import { describe, expect, it } from 'vitest'
import { articleHref, findContentMatch } from '../src/lib/contentSearch.ts'

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
