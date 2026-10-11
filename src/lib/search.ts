import { normalizeSearchText } from './normalize.ts'

export interface SearchableArticle {
  slug: string
  title: string
  suggestions: string[]
}

/** Fuse score at or below which a single fuzzy result may auto-navigate on Enter. */
export const AUTO_NAVIGATE_MAX_SCORE = 0.08

/** Articles whose title or any `suggestions` entry equals the query after normalization. */
export function findExactMatches<T extends SearchableArticle>(articles: readonly T[], query: string): T[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []
  return articles.filter((article) =>
    [article.title, ...article.suggestions].some((phrase) => normalizeSearchText(phrase) === normalized))
}

/**
 * Decides what pressing Enter should do.
 * - exactly one exact match → navigate to it
 * - no exact match, one fuzzy result with a very strong score → navigate to it
 * - otherwise → show the results list
 */
export function decideSubmit<T extends SearchableArticle>(
  articles: readonly T[],
  query: string,
  fuzzy: readonly { slug: string; score: number }[],
): { action: 'navigate'; slug: string } | { action: 'list' } {
  const exact = findExactMatches(articles, query)
  if (exact.length === 1) return { action: 'navigate', slug: exact[0].slug }
  if (exact.length === 0 && fuzzy.length === 1 && fuzzy[0].score <= AUTO_NAVIGATE_MAX_SCORE) {
    return { action: 'navigate', slug: fuzzy[0].slug }
  }
  return { action: 'list' }
}
