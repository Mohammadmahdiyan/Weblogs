import { describe, expect, it } from 'vitest'
import { pageTargets, parsePageQuery, suggestBooks, type BookLike } from '../src/lib/bookQuery.ts'

const pages = (count: number) => Array.from({ length: count }, (_, index) => ({ number: index + 1 }))
const books: BookLike[] = [
  { slug: 'bukhari', title: 'شرح صحیح بخاری', pages: pages(300) },
  { slug: 'muslim', title: 'شرح صحیح مسلم', pages: pages(50) },
  { slug: 'fiqh', title: 'شرح الفقه الاکبر' },
  { slug: 'other', title: 'کتاب دیگر' },
]

describe('parsePageQuery', () => {
  it.each([
    'شرح صحیح بخاری ص۲۱۶',
    'شرح صحیح بخاری صفحه۲۱۶',
    'شرح صحیح بخاری  صفحه ۲۱۶',
    'شرح صحیح بخاری ص 216',
    'شرح صحیح بخاری صفحهٔ ٢١٦',
    'شرح صحیح بخاری page 216',
  ])('reads %s', (query) => {
    expect(parsePageQuery(query)).toEqual({ title: 'شرح صحیح بخاری', page: 216 })
  })

  it('does not treat the letter ص inside a word as a marker', () => {
    expect(parsePageQuery('شرح صحیح بخاری')).toBeNull()
    expect(parsePageQuery('شرح صحیح 216')).toBeNull()
    expect(parsePageQuery('ص۲۱۶')).toBeNull()
    expect(parsePageQuery('شرح صح')).toBeNull()
  })

  it('keeps a number that belongs to the name', () => {
    expect(parsePageQuery('کتاب ۲ ص ۱۰')).toEqual({ title: 'کتاب 2', page: 10 })
  })
})

describe('suggestBooks', () => {
  it('lists the books that contain what was typed', () => {
    expect(suggestBooks(books, 'شرح صح').map((book) => book.slug)).toEqual(['bukhari', 'muslim'])
    expect(suggestBooks(books, 'شرح').map((book) => book.slug)).toHaveLength(3)
  })

  it('ranks the exact name first and ignores marks and letter variants', () => {
    expect(suggestBooks(books, 'شَرْحُ صَحيح بخاري')[0].slug).toBe('bukhari')
  })

  it('finds nothing for unknown text', () => {
    expect(suggestBooks(books, 'ناموجود')).toEqual([])
    expect(suggestBooks(books, '  ')).toEqual([])
  })
})

describe('pageTargets', () => {
  it('goes to the exact book and says the page exists', () => {
    const [target] = pageTargets(books, { title: 'شرح صحیح بخاری', page: 216 })
    expect(target.book.slug).toBe('bukhari')
    expect(target.exists).toBe(true)
  })

  it('reports a missing page with the last page of that book', () => {
    const [target] = pageTargets(books, { title: 'شرح صحیح مسلم', page: 216 })
    expect(target.exists).toBe(false)
    expect(target.last).toBe(50)
  })

  it('offers every book a partial name can mean', () => {
    expect(pageTargets(books, { title: 'شرح صحیح', page: 10 }).map((target) => target.book.slug)).toEqual(['bukhari', 'muslim'])
  })
})
