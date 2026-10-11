import { describe, expect, it } from 'vitest'
import { decideSubmit, findExactMatches } from '../src/lib/search.ts'

const articles = [
  { slug: 'married-prophet-with-ayesha', title: 'ازدواج پیامبر ص با مادر عایشه رض', suggestions: ['دلیل ازدواج پیامبر ص با مادر عایشه رض', 'ازدواج پیامبر ص با دختر 6 ساله'] },
  { slug: 'other', title: 'مقاله دیگر', suggestions: ['سوال دیگر'] },
]

describe('exact suggestion → navigate', () => {
  it('matches a suggestion regardless of Persian digits and letter variants', () => {
    expect(findExactMatches(articles, 'ازدواج پیامبر ص با دختر ۶ ساله').map((a) => a.slug)).toEqual(['married-prophet-with-ayesha'])
  })

  it('navigates when exactly one article matches', () => {
    expect(decideSubmit(articles, 'مقاله دیگر', [])).toEqual({ action: 'navigate', slug: 'other' })
  })

  it('shows the list for fuzzy queries without a strong single match', () => {
    expect(decideSubmit(articles, 'ازدواج', [{ slug: 'a', score: 0.3 }])).toEqual({ action: 'list' })
  })

  it('shows the list when more than one article matches exactly', () => {
    const duplicate = [...articles, { slug: 'copy', title: 'مقاله دیگر', suggestions: [] }]
    expect(decideSubmit(duplicate, 'مقاله دیگر', [])).toEqual({ action: 'list' })
  })
})
