import { describe, expect, it } from 'vitest'
import { bookNavigation, jumpLabel, lastPageHint, parsePageParam, parseTypedPage, stopPath } from '../src/lib/bookPages.ts'

const pages = (count: number) => Array.from({ length: count }, (_, index) => ({ number: index + 1 }))

describe('bookNavigation', () => {
  it('has nothing to navigate for a book without page files', () => {
    expect(bookNavigation(undefined, null)).toBeNull()
    expect(bookNavigation([], null)).toBeNull()
  })

  it('goes from the introduction to page 1 and back', () => {
    const intro = bookNavigation(pages(3), null)
    expect(intro?.position).toBe(0)
    expect(intro?.back).toEqual([])
    expect(intro?.forward.map((jump) => [jump.step, jump.to.number])).toEqual([[1, 1]])
    const first = bookNavigation(pages(3), 1)
    expect(first?.back.map((jump) => jump.to.number)).toEqual([null])
  })

  it('offers 10 / 100 / 1000 only when that many pages exist', () => {
    const small = bookNavigation(pages(5), 2)
    expect(small?.back.map((jump) => jump.step)).toEqual([1])
    expect(small?.forward.map((jump) => jump.step)).toEqual([1])

    const middle = bookNavigation(pages(250), 120)
    expect(middle?.back.map((jump) => jump.step)).toEqual([100, 10, 1])
    expect(middle?.forward.map((jump) => jump.step)).toEqual([1, 10, 100])
    expect(middle?.forward.find((jump) => jump.step === 100)?.to.number).toBe(220)

    const nearEnd = bookNavigation(pages(250), 200)
    expect(nearEnd?.forward.map((jump) => jump.step)).toEqual([1, 10])
  })

  it('reaches 1000 and 10000 pages in a very large book', () => {
    const large = bookNavigation(pages(12000), 1000)
    expect(large?.back.map((jump) => jump.step)).toEqual([1000, 100, 10, 1])
    expect(large?.forward.map((jump) => jump.step)).toEqual([1, 10, 100, 1000, 10000])
    expect(large?.forward.find((jump) => jump.step === 10000)?.to.number).toBe(11000)
  })

  it('follows page NUMBER order and skips missing numbers', () => {
    const navigation = bookNavigation([{ number: 10 }, { number: 2 }, { number: 3 }], 3)
    expect(navigation?.stops.map((stop) => stop.number)).toEqual([null, 2, 3, 10])
    expect(navigation?.forward[0].to.number).toBe(10)
  })

  it('is null for a page that does not exist', () => {
    expect(bookNavigation(pages(3), 9)).toBeNull()
  })
})

describe('labels and paths', () => {
  it('names the jumps in Persian', () => {
    expect(jumpLabel(1, 'forward')).toBe('صفحه بعد')
    expect(jumpLabel(10, 'back')).toBe('ده صفحه قبل')
    expect(jumpLabel(100, 'forward')).toBe(`${(100).toLocaleString('fa-IR')} صفحه بعد`)
  })

  it('builds addresses', () => {
    expect(stopPath('/books/x', { number: null })).toBe('/books/x')
    expect(stopPath('/books/x', { number: 12 })).toBe('/books/x/12')
  })

  it('reads the page from the address', () => {
    expect(parsePageParam(undefined)).toBeUndefined()
    expect(parsePageParam('12')).toBe(12)
    expect(parsePageParam('0')).toBeNaN()
    expect(parsePageParam('abc')).toBeNaN()
    expect(parsePageParam('007')).toBeNaN()
  })
})

describe('first / last and the go-to box', () => {
  it('knows the first and last numbered page (not the introduction)', () => {
    const navigation = bookNavigation(pages(100), 50)
    expect(navigation?.first.number).toBe(1)
    expect(navigation?.last.number).toBe(100)
  })

  it('uses the last page as the hint, without a thousands separator', () => {
    expect(lastPageHint(bookNavigation(pages(100), 1)!.last)).toBe((100).toLocaleString('fa-IR'))
    expect(lastPageHint(bookNavigation(pages(4000), 1)!.last)).toBe('۴۰۰۰')
  })

  it('reads typed numbers in any digit style', () => {
    expect(parseTypedPage('۱۲۰')).toBe(120)
    expect(parseTypedPage('٣٤')).toBe(34)
    expect(parseTypedPage(' 7 ')).toBe(7)
    expect(parseTypedPage('')).toBeNaN()
    expect(parseTypedPage('1.5')).toBeNaN()
    expect(parseTypedPage('abc')).toBeNaN()
  })
})
