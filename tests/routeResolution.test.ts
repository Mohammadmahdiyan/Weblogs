import { describe, expect, it } from 'vitest'
import { resolveRoute, type RouteCollections } from '../src/lib/routeResolution.ts'
import type { ArticleMeta } from '../src/lib/types.ts'

function article(
  slug: string,
  options: Partial<Pick<ArticleMeta, 'aliases' | 'pages' | 'pageCount'>> = {},
): ArticleMeta {
  return {
    slug,
    title: slug,
    description: '',
    date: '',
    updated: '',
    tags: [],
    suggestions: [],
    cover: null,
    readingTime: 1,
    ...options,
  }
}

const collections: RouteCollections = {
  media: {
    route: '/media',
    items: [
      article('one/shared'),
      article('two/shared'),
      article('persian/سلام', { aliases: ['old-name', 'topic'] }),
      article('legacy/topic'),
    ],
    hidden: ['locked'],
    folderNames: { one: 'One', persian: 'Persian' },
  },
  books: {
    route: '/books',
    items: [
      article('answer/alhad-noven', {
        aliases: ['legacy-book'],
        pages: [{ number: 27 }, { number: 28 }],
        pageCount: 30,
      }),
      article('other/alhad-noven', { pages: [{ number: 27 }] }),
      article('no-pages'),
      article('declared-count-only', { pageCount: 5 }),
    ],
    hidden: ['hidden-book'],
    folderNames: { answer: 'Answer' },
  },
}

describe('resolveRoute', () => {
  it('resolves home, collection roots, directories, and articles', () => {
    expect(resolveRoute('/', collections)).toEqual({ kind: 'home' })
    expect(resolveRoute('/media/', collections)).toEqual({ kind: 'home', collection: 'media' })
    expect(resolveRoute('/media/one/', collections)).toEqual({ kind: 'directory', collection: 'media', slug: 'one' })
    expect(resolveRoute('/media/one/shared', collections)).toEqual({
      kind: 'article',
      collection: 'media',
      slug: 'one/shared',
    })
  })

  it('resolves hidden articles and valid book pages', () => {
    expect(resolveRoute('/media/locked', collections)).toEqual({ kind: 'hidden', collection: 'media', slug: 'locked' })
    expect(resolveRoute('/books/hidden-book/27', collections)).toEqual({
      kind: 'hidden',
      collection: 'books',
      slug: 'hidden-book',
    })
    expect(resolveRoute('/books/answer/alhad-noven/27', collections)).toEqual({
      kind: 'bookPage',
      collection: 'books',
      slug: 'answer/alhad-noven',
      page: '27',
    })
  })

  it('redirects unique short and alias routes while preserving nested canonical paths', () => {
    expect(resolveRoute('/media/%D8%B3%D9%84%D8%A7%D9%85/', collections)).toEqual({
      kind: 'redirect',
      to: '/media/persian/سلام',
    })
    expect(resolveRoute('/media/old-name', collections)).toEqual({
      kind: 'redirect',
      to: '/media/persian/سلام',
    })
    expect(resolveRoute('/media/topic', collections)).toEqual({
      kind: 'redirect',
      to: '/media/legacy/topic',
    })
    expect(resolveRoute('/books/alhad-noven/27', collections)).toEqual({
      kind: 'notFound',
      candidates: [
        { href: '/books/answer/alhad-noven', title: 'answer/alhad-noven' },
        { href: '/books/other/alhad-noven', title: 'other/alhad-noven' },
      ],
    })
    expect(resolveRoute('/blog/old-name', collections)).toEqual({
      kind: 'redirect',
      to: '/media/persian/سلام',
    })
  })

  it('reports ambiguous short routes and rejects unknown directories and missing pages', () => {
    expect(resolveRoute('/media/shared', collections)).toMatchObject({
      kind: 'notFound',
      candidates: [{ href: '/media/one/shared' }, { href: '/media/two/shared' }],
    })
    expect(resolveRoute('/media/unknown', collections)).toEqual({ kind: 'notFound', candidates: [] })
    expect(resolveRoute('/books/answer/alhad-noven/31', collections)).toEqual({
      kind: 'notFound',
      candidates: [],
    })
    expect(resolveRoute('/books/no-pages/7', collections)).toEqual({ kind: 'notFound', candidates: [] })
    expect(resolveRoute('/books/unknown-book/7', collections)).toEqual({ kind: 'notFound', candidates: [] })
  })

  it('distinguishes pending pages within the declared or inferred page range', () => {
    expect(resolveRoute('/books/answer/alhad-noven/29', collections)).toEqual({
      kind: 'bookPagePending',
      collection: 'books',
      slug: 'answer/alhad-noven',
      page: '29',
    })
    expect(resolveRoute('/books/legacy-book/29', collections)).toEqual({
      kind: 'redirect',
      to: '/books/answer/alhad-noven/29',
    })
    expect(resolveRoute('/books/other/alhad-noven/9999', collections)).toEqual({
      kind: 'bookPagePending',
      collection: 'books',
      slug: 'other/alhad-noven',
      page: '9999',
    })
    expect(resolveRoute('/books/other/alhad-noven/10001', collections)).toEqual({
      kind: 'notFound',
      candidates: [],
    })
    expect(resolveRoute('/books/declared-count-only/5', collections)).toEqual({
      kind: 'bookPagePending',
      collection: 'books',
      slug: 'declared-count-only',
      page: '5',
    })
    expect(resolveRoute('/books/declared-count-only/6', collections)).toEqual({
      kind: 'notFound',
      candidates: [],
    })
  })
})
