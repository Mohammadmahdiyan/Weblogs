import { normalizeWithMap, type NormalizedText } from './normalize.ts'

/** Query-string key that tells an article page which text to scroll to and highlight. */
export const FIND_PARAM = 'find'

/** Query-string key with the 1-based occurrence to jump to when the text appears several times (omitted = first). */
export const FIND_INDEX_PARAM = 'n'

/** Characters of context kept on EACH side of the match, so the match is always in the middle. */
export const SNIPPET_CONTEXT = 45

export interface ContentMatch {
  before: string
  match: string
  after: string
  /** Index of the match in the ORIGINAL content string. */
  start: number
}

/**
 * Link to an article; after a content search it also carries the text to jump to and, when the reader
 * stepped to a later occurrence with the arrows, which occurrence (0-based `occurrence`, written 1-based).
 */
export function articleHref(slug: string, contentTerm = '', occurrence = 0, basePath = '/blog'): string {
  const term = contentTerm.trim()
  if (!term) return `${basePath}/${slug}`
  const index = occurrence > 0 ? `&${FIND_INDEX_PARAM}=${Math.floor(occurrence) + 1}` : ''
  return `${basePath}/${slug}?${FIND_PARAM}=${encodeURIComponent(term)}${index}`
}

/** Reads the 0-based occurrence out of the `n` query value (missing / invalid → 0). */
export function parseOccurrence(value: string | null): number {
  const number = Number.parseInt(value ?? '', 10)
  return Number.isFinite(number) && number > 1 ? number - 1 : 0
}

const cache = new Map<string, NormalizedText>()

function normalizedBody(content: string): NormalizedText {
  let value = cache.get(content)
  if (!value) {
    value = normalizeWithMap(content)
    // Bodies are few; the cap only protects against an unbounded index.
    if (cache.size > 200) cache.clear()
    cache.set(content, value)
  }
  return value
}

const squash = (value: string) => value.replace(/\s+/g, ' ')

function snippetAt(content: string, start: number, end: number, context: number): ContentMatch {
  const room = Math.min(context, start, content.length - end)
  const from = start - room
  const to = end + room
  return {
    before: `${from > 0 ? '…' : ''}${squash(content.slice(from, start))}`,
    match: squash(content.slice(start, end)),
    after: `${squash(content.slice(end, to))}${to < content.length ? '…' : ''}`,
    start,
  }
}

/**
 * Finds EVERY occurrence of `query` in `content` (ignoring ي/ی, ZWNJ, diacritics, digit forms…), in reading
 * order and without overlaps. Each one comes with a snippet that has the match in the exact middle: the same
 * number of characters before and after it (fewer when the match is close to the start or end of the text).
 */
export function findContentMatches(content: string, query: string, context = SNIPPET_CONTEXT): ContentMatch[] {
  const needle = normalizeWithMap(query).text
  if (!needle) return []
  const body = normalizedBody(content)
  const matches: ContentMatch[] = []

  for (let index = body.text.indexOf(needle); index >= 0; index = body.text.indexOf(needle, index + needle.length)) {
    const start = body.map[index]
    const end = body.map[index + needle.length - 1] + 1
    matches.push(snippetAt(content, start, end, context))
  }
  return matches
}

/** The first occurrence only (see `findContentMatches`). */
export function findContentMatch(content: string, query: string, context = SNIPPET_CONTEXT): ContentMatch | null {
  return findContentMatches(content, query, context)[0] ?? null
}

/**
 * Which occurrence INSIDE THE ARTICLE TEXT a search hit is. The search index starts with the article title,
 * which is not part of the rendered body, so hits that sit in the title do not count.
 */
export function bodyOccurrence(matches: readonly ContentMatch[], index: number, titleLength: number): number {
  const inTitle = matches.filter((match) => match.start < titleLength).length
  return Math.max(0, index - inTitle)
}
