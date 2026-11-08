import type { ArticleMeta } from './types.ts'

type CollectionId = 'media' | 'books'

export interface RouteCollection {
  route: '/media' | '/books'
  items: ArticleMeta[]
  hidden: string[]
  folderNames: Record<string, string>
}

export type RouteResolution =
  | { kind: 'home'; collection?: CollectionId }
  | { kind: 'directory'; collection: CollectionId; slug: string }
  | { kind: 'article'; collection: CollectionId; slug: string }
  | { kind: 'bookPage'; collection: 'books'; slug: string; page: string }
  | { kind: 'bookPagePending'; collection: 'books'; slug: string; page: string }
  | { kind: 'hidden'; collection: CollectionId; slug: string }
  | { kind: 'redirect'; to: string }
  | { kind: 'notFound'; candidates: { href: string; title: string }[] }

export type RouteCollections = Record<CollectionId, RouteCollection>

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function canonicalPath(collection: CollectionId, slug: string, page?: string): string {
  return `${collection === 'media' ? '/media' : '/books'}/${slug}${page ? `/${page}` : ''}`
}

function hasPage(article: ArticleMeta, page: string): boolean {
  return /^\d+$/.test(page) && article.pages?.some((item) => item.number === Number(page)) === true
}

function isPendingPage(article: ArticleMeta, page: string): boolean {
  const number = Number(page)
  if (!Number.isInteger(number) || number < 1) return false
  if (article.pageCount !== undefined) return number <= article.pageCount
  return article.pages !== undefined && number <= 10000
}

function endingWithPath(slug: string, path: string): boolean {
  return slug === path || slug.endsWith(`/${path}`)
}

function candidatesFor(matches: ArticleMeta[], collection: CollectionId): { href: string; title: string }[] {
  return [...new Map(matches.map((item) => [item.slug, item])).values()]
    .map((item) => ({ href: canonicalPath(collection, item.slug), title: item.title }))
    .sort((left, right) => left.href.localeCompare(right.href))
}

function knownDirectory(collection: RouteCollection, slug: string): boolean {
  if (collection.folderNames[slug]) return true
  return collection.items.some((item) => item.slug.startsWith(`${slug}/`))
}

/** Resolves canonical, hidden, legacy, short, and directory routes without touching browser state. */
export function resolveRoute(pathname: string, collections: RouteCollections): RouteResolution {
  const pathOnly = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/'
  if (pathOnly === '/') return { kind: 'home' }

  const incomingSegments = pathOnly.split('/').filter(Boolean).map(decodeSegment)
  let collectionId: CollectionId
  let segments: string[]
  let legacy = false
  if (incomingSegments[0] === 'blog') {
    collectionId = 'media'
    segments = incomingSegments.slice(1)
    legacy = true
    if (segments.length === 0) return { kind: 'redirect', to: '/media' }
  } else if (incomingSegments[0] === 'media' || incomingSegments[0] === 'books') {
    collectionId = incomingSegments[0]
    segments = incomingSegments.slice(1)
  } else {
    return { kind: 'notFound', candidates: [] }
  }

  const collection = collections[collectionId]
  const typedPath = segments.join('/')
  if (!typedPath)
    return legacy ? { kind: 'redirect', to: collection.route } : { kind: 'home', collection: collectionId }

  const exact = collection.items.find((item) => item.slug === typedPath)
  if (exact) {
    return legacy
      ? { kind: 'redirect', to: canonicalPath(collectionId, exact.slug) }
      : { kind: 'article', collection: collectionId, slug: exact.slug }
  }

  const pageMatch = collectionId === 'books' ? typedPath.match(/^(.*)\/(\d+)$/) : null
  if (pageMatch) {
    const slug = pageMatch[1]
    const page = pageMatch[2]
    if (collection.hidden.includes(slug)) {
      return legacy
        ? { kind: 'redirect', to: canonicalPath(collectionId, slug, page) }
        : { kind: 'hidden', collection: collectionId, slug }
    }
    const book = collection.items.find((item) => item.slug === slug)
    if (book && hasPage(book, page)) {
      const pageNumber = String(Number(page))
      return legacy
        ? { kind: 'redirect', to: canonicalPath(collectionId, book.slug, pageNumber) }
        : { kind: 'bookPage', collection: 'books', slug: book.slug, page: pageNumber }
    }
    if (book && isPendingPage(book, page)) {
      const pageNumber = String(Number(page))
      return legacy
        ? { kind: 'redirect', to: canonicalPath(collectionId, book.slug, pageNumber) }
        : { kind: 'bookPagePending', collection: 'books', slug: book.slug, page: pageNumber }
    }
  }

  if (collection.hidden.includes(typedPath)) {
    return legacy
      ? { kind: 'redirect', to: canonicalPath(collectionId, typedPath) }
      : { kind: 'hidden', collection: collectionId, slug: typedPath }
  }

  const matchPage = pageMatch?.[2]
  const suffixPath = pageMatch?.[1] ?? typedPath
  const suffixMatches = collection.items.filter(
    (item) =>
      endingWithPath(item.slug, suffixPath) &&
      (!matchPage || (collectionId === 'books' && (hasPage(item, matchPage) || isPendingPage(item, matchPage)))),
  )
  const page = matchPage && collectionId === 'books' ? matchPage : undefined
  if (suffixMatches.length === 1) {
    return { kind: 'redirect', to: canonicalPath(collectionId, suffixMatches[0].slug, page) }
  }
  if (suffixMatches.length > 1) {
    return { kind: 'notFound', candidates: candidatesFor(suffixMatches, collectionId) }
  }

  const firstTypedSegment = segments[0]
  const aliasMatches = firstTypedSegment
    ? collection.items.filter(
        (item) =>
          item.aliases?.includes(firstTypedSegment) &&
          (!matchPage || hasPage(item, matchPage) || isPendingPage(item, matchPage)),
      )
    : []
  if (aliasMatches.length === 1) {
    return { kind: 'redirect', to: canonicalPath(collectionId, aliasMatches[0].slug, page) }
  }
  if (aliasMatches.length > 1) return { kind: 'notFound', candidates: candidatesFor(aliasMatches, collectionId) }

  if (knownDirectory(collection, typedPath)) {
    return legacy
      ? { kind: 'redirect', to: `${collection.route}/${typedPath}` }
      : { kind: 'directory', collection: collectionId, slug: typedPath }
  }
  return { kind: 'notFound', candidates: [] }
}
