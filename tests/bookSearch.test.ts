import { describe, expect, it } from 'vitest'
import { bookEntries, searchEntry } from '../src/lib/bookSearch.ts'
import type { SearchEntry } from '../src/lib/types.ts'

const entry = (slug: string, title: string, content: string): SearchEntry => ({ slug, title, phrases: [], content })
const index: SearchEntry[] = [
  entry('other', 'کتاب دیگر', 'کتاب دیگر گنجینه'),
  entry('book/10', 'کتاب، صفحه ۱۰', 'صفحهٔ ده درباره گنجینه است'),
  entry('book/2', 'کتاب، صفحه ۲', 'در صفحهٔ دو گنجینه و دوباره گنجینه'),
  entry('book', 'کتاب', 'کتاب\nمعرفی کتاب و گنجینه'),
  entry('book-two/1', 'کتاب دو، صفحه ۱', 'گنجینه'),
]

describe('bookEntries', () => {
  it('keeps only this book (not books whose name starts the same), introduction first, pages by number', () => {
    expect(bookEntries(index, 'book').map((item) => item.slug)).toEqual(['book', 'book/2', 'book/10'])
  })
})

describe('searchEntry', () => {
  it('finds every occurrence with its 0-based occurrence and page', () => {
    const hits = searchEntry(index[2], 'book', 'گنجینه')
    expect(hits.map((hit) => [hit.page, hit.occurrence])).toEqual([[2, 0], [2, 1]])
    expect(hits[0].snippet.match).toBe('گنجینه')
  })

  it('does not count the title line of the introduction (it is not in the page text)', () => {
    expect(searchEntry(index[3], 'book', 'کتاب').map((hit) => hit.occurrence)).toEqual([0])
    expect(searchEntry(index[3], 'book', 'گنجینه')[0].page).toBeNull()
  })

  it('finds nothing for a missing term', () => {
    expect(searchEntry(index[1], 'book', 'چیز دیگری')).toEqual([])
  })
})
