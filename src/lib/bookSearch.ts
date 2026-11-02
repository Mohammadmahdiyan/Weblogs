import { findContentMatches, type ContentMatch } from './contentSearch.ts'
import type { SearchEntry } from './types.ts'

export interface BookHit {
  /** Address part after /books/: `<book>` for the introduction, `<book>/<page>` for a page. */
  slug: string
  /** Page number, or null for the introduction. */
  page: number | null
  /** 0-based occurrence INSIDE that page's text (the `n` of the link). */
  occurrence: number
  snippet: ContentMatch
}

/** The search entries of ONE book: its introduction first, then its pages in page-number order. */
export function bookEntries(index: readonly SearchEntry[], bookSlug: string): SearchEntry[] {
  const pageOf = (entry: SearchEntry) => (entry.slug === bookSlug ? 0 : Number(entry.slug.slice(bookSlug.length + 1)))
  return index
    .filter((entry) => entry.slug === bookSlug || (entry.slug.startsWith(`${bookSlug}/`) && Number.isInteger(pageOf(entry))))
    .sort((first, second) => pageOf(first) - pageOf(second))
}

/** Every occurrence of `term` in one entry (an introduction's own title line is not part of the page text). */
export function searchEntry(entry: SearchEntry, bookSlug: string, term: string): BookHit[] {
  const content = entry.content ?? ''
  if (!content) return []
  const titleLength = content.startsWith(entry.title) ? entry.title.length : 0
  const page = entry.slug === bookSlug ? null : Number(entry.slug.slice(bookSlug.length + 1))
  return findContentMatches(content, term)
    .filter((match) => match.start >= titleLength)
    .map((snippet, occurrence) => ({ slug: entry.slug, page, occurrence, snippet }))
}
