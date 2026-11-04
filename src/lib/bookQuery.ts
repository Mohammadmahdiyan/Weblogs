import { normalizeSearchText } from './normalize.ts'

/** The part of a book that the search box needs. */
export interface BookLike {
  slug: string
  title: string
  pages?: { number: number; title?: string }[]
}

export interface PageQuery {
  /** What was typed before the page marker: (part of) a book's name. */
  title: string
  page: number
}

/**
 * «شرح صحیح بخاری ص۲۱۶», «… صفحه۲۱۶», «… صفحه ۲۱۶», «… page 216» → the book's name and the page.
 * The marker (ص / صفحه / page / p) must stand apart from the name: a letter ص inside a word («صحیح») is never a
 * marker. Persian / Arabic digits and the usual Arabic letter variants are accepted. null = not a page query.
 */
export function parsePageQuery(query: string): PageQuery | null {
  // normalizeSearchText turns digits into ASCII and «صفحهٔ / صفحة» into «صفحه».
  const text = normalizeSearchText(query)
  const match = text.match(/^(.+?) +(?:صفحه|ص|page|pg|p)[ .:]*(\d{1,6})$/u)
  if (!match) return null
  const page = Number(match[2])
  const title = match[1].trim()
  return title.length >= 2 && page >= 1 ? { title, page } : null
}

/**
 * Books whose name contains every word typed so far («شرح صح» → «شرح صحیح بخاری», «شرح صحیح مسلم»), best first:
 * exact name, then names that start with the text, then names that contain it as written, then the rest.
 */
export function suggestBooks<T extends { title: string }>(books: readonly T[], query: string, limit = 8): T[] {
  const text = normalizeSearchText(query)
  const words = text.split(' ').filter(Boolean)
  if (words.length === 0) return []

  return books
    .map((book) => {
      const title = normalizeSearchText(book.title)
      if (!words.every((word) => title.includes(word))) return null
      const rank = title === text ? 0 : title.startsWith(text) ? 1 : title.includes(text) ? 2 : 3
      return { book, rank, at: title.indexOf(words[0]) }
    })
    // Equal rank keeps the order of the list (newest book first): `sort` is stable.
    .filter((item): item is { book: T; rank: number; at: number } => item !== null)
    .sort((first, second) => first.rank - second.rank || first.at - second.at)
    .slice(0, limit)
    .map((item) => item.book)
}

export interface PageTarget<T extends BookLike> {
  book: T
  page: number
  /** The book has a page file with this number. */
  exists: boolean
  /** The book's last page number (null when it has no page files). */
  last: number | null
  /** The page's own title (chapter), when it has one. */
  chapter?: string
}

/** The books a page query can mean, each with whether that page exists. An exact name matches only that book. */
export function pageTargets<T extends BookLike>(books: readonly T[], query: PageQuery, limit = 6): PageTarget<T>[] {
  const candidates = suggestBooks(books, query.title, limit)
  const exact = candidates.filter((book) => normalizeSearchText(book.title) === normalizeSearchText(query.title))
  return (exact.length > 0 ? exact : candidates).map((book) => {
    const pages = book.pages ?? []
    const found = pages.find((page) => page.number === query.page)
    return {
      book,
      page: query.page,
      exists: found !== undefined,
      last: pages.length > 0 ? Math.max(...pages.map((page) => page.number)) : null,
      ...(found?.title ? { chapter: found.title } : {}),
    }
  })
}
