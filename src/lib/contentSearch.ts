import { normalizeWithMap, type NormalizedText } from './normalize.ts'

/** Query-string key that tells an article page which text to scroll to and highlight. */
export const FIND_PARAM = 'find'

/** Characters of context kept on EACH side of the match, so the match is always in the middle. */
export const SNIPPET_CONTEXT = 45

export interface ContentMatch {
  before: string
  match: string
  after: string
}

/** Link to an article; after a content search it also carries the text to jump to. */
export function articleHref(slug: string, contentTerm = ''): string {
  const term = contentTerm.trim()
  return term ? `/blog/${slug}?${FIND_PARAM}=${encodeURIComponent(term)}` : `/blog/${slug}`
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

/**
 * Finds the first occurrence of `query` in `content` (ignoring ي/ی, ZWNJ, diacritics, digit forms…) and
 * returns a snippet with the match in the exact middle: the same number of characters before and after it
 * (fewer when the match is close to the start or end of the text).
 */
export function findContentMatch(content: string, query: string, context = SNIPPET_CONTEXT): ContentMatch | null {
  const needle = normalizeWithMap(query).text
  if (!needle) return null
  const body = normalizedBody(content)
  const index = body.text.indexOf(needle)
  if (index < 0) return null

  const start = body.map[index]
  const end = body.map[index + needle.length - 1] + 1
  const room = Math.min(context, start, content.length - end)
  const from = start - room
  const to = end + room

  return {
    before: `${from > 0 ? '…' : ''}${squash(content.slice(from, start))}`,
    match: squash(content.slice(start, end)),
    after: `${squash(content.slice(end, to))}${to < content.length ? '…' : ''}`,
  }
}
