import { describe, expect, it } from 'vitest'
import {
  classifyLink,
  extractHeadingIds,
  extractInternalLinks,
  isPendingPage,
  resolveContentRoute,
  rewriteResolvableLinks,
  type ArticleRoute,
  type RouteTable,
} from '../scripts/lib/link-check.ts'

const routes: RouteTable = {
  articles: [
    {
      collection: 'books',
      slug: 'answer-to-shobhat/alhad-noven-part1',
      directory: 'content/books/answer-to-shobhat/alhad-noven-part1',
      aliases: ['elhad'],
      pages: new Set(['27']),
      headings: new Map([
        ['', new Set(['book-heading'])],
        ['27', new Set(['page-heading'])],
      ]),
    },
    {
      collection: 'media',
      slug: 'درستی/نمونه',
      directory: 'content/media/درستی/نمونه',
      aliases: [],
      pages: new Set(),
      headings: new Map([['', new Set()]]),
    },
  ],
  directories: new Set(['/books', '/books/answer-to-shobhat', '/media', '/media/درستی']),
}

describe('extractInternalLinks', () => {
  it('finds Markdown, HTML, and directive links with source lines and offsets', () => {
    const markdown = [
      '[page](/books/answer-to-shobhat/alhad-noven-part1/27#page-heading)',
      '<a href="/media/example">article</a>',
      ':button[go]{href="/books/elhad/27"}',
      ':iconbutton[search]{href="/search"}',
      ':::source{url="/media/example"}',
      ':::course{href="/courses/sample"}',
      'text',
      ':::',
    ].join('\r\n')

    const links = extractInternalLinks(markdown)
    expect(links.map(({ href, line }) => [href, line])).toEqual([
      ['/books/answer-to-shobhat/alhad-noven-part1/27#page-heading', 1],
      ['/media/example', 2],
      ['/books/elhad/27', 3],
      ['/media/example', 5],
    ])
    for (const link of links) {
      expect(markdown.slice(link.start, link.end)).toBe(link.href)
    }
  })
})

describe('resolveContentRoute', () => {
  it('resolves section and known directory routes, including trailing slashes', () => {
    expect(resolveContentRoute('/', routes)).toMatchObject({ directory: '/' })
    expect(resolveContentRoute('/books/', routes)).toMatchObject({ directory: '/books' })
    expect(resolveContentRoute('/books/answer-to-shobhat/', routes)).toMatchObject({
      directory: '/books/answer-to-shobhat',
    })
  })

  it('resolves canonical and unique-suffix book pages only when the page exists', () => {
    expect(resolveContentRoute('/books/answer-to-shobhat/alhad-noven-part1/27', routes)).toMatchObject({
      page: '27',
      canonical: '/books/answer-to-shobhat/alhad-noven-part1/27',
    })
    expect(resolveContentRoute('/books/alhad-noven-part1/27', routes)).toMatchObject({
      page: '27',
      canonical: '/books/answer-to-shobhat/alhad-noven-part1/27',
    })
    expect(resolveContentRoute('/books/alhad-noven-part1/563', routes)).toBeNull()
  })

  it('resolves alias routes and percent-encoded Persian path segments', () => {
    expect(resolveContentRoute('/books/elhad/27', routes)).toMatchObject({
      canonical: '/books/answer-to-shobhat/alhad-noven-part1/27',
    })
    expect(
      resolveContentRoute('/media/%D8%AF%D8%B1%D8%B3%D8%AA%DB%8C/%D9%86%D9%85%D9%88%D9%86%D9%87', routes),
    ).toMatchObject({
      canonical: '/media/درستی/نمونه',
    })
  })

  it('does not resolve unknown routes or malformed percent escapes', () => {
    expect(resolveContentRoute('/media/unknown', routes)).toBeNull()
    expect(resolveContentRoute('/media/%E0%A4%A', routes)).toBeNull()
  })
})

describe('extractHeadingIds', () => {
  it('matches rehype-slug IDs, including duplicate headings', () => {
    expect(extractHeadingIds('# Heading\n\n## Heading')).toEqual(new Set(['heading', 'heading-1']))
  })
})

describe('rewriteResolvableLinks', () => {
  it('uses the unique canonical route and preserves query, fragment, and CRLF line endings', () => {
    const markdown = '[page](/Weblogs/books/elhad/27?view=full#page-heading)\r\n'
    const result = rewriteResolvableLinks(markdown, routes)

    expect(result.markdown).toBe('[page](/books/answer-to-shobhat/alhad-noven-part1/27?view=full#page-heading)\r\n')
    expect(result.replacements).toHaveLength(1)
  })

  it('does not rewrite an ambiguous suffix', () => {
    const ambiguousRoutes: RouteTable = {
      ...routes,
      articles: [
        ...routes.articles,
        {
          collection: 'books',
          slug: 'another-book/alhad-noven-part1',
          directory: 'content/books/another-book/alhad-noven-part1',
          aliases: [],
          pages: new Set(['27']),
          headings: new Map([['27', new Set()]]),
        },
      ],
    }
    const markdown = '[page](/books/alhad-noven-part1/27)'
    expect(rewriteResolvableLinks(markdown, ambiguousRoutes)).toMatchObject({
      markdown,
      replacements: [],
    })
  })
})

describe('pages that are announced but not written yet', () => {
  const book = routes.articles[0] as ArticleRoute
  const withCount: RouteTable = { ...routes, articles: [{ ...book, pageCount: 563 }, ...routes.articles.slice(1)] }
  const link = (href: string) => ({ file: 'x.md', href, line: 1, start: 0, end: href.length })

  it('is pending between 1 and pageCount (or 10000 when there is no pageCount) and never when the page exists', () => {
    expect(isPendingPage(book, '100')).toBe(true)
    expect(isPendingPage(book, '27')).toBe(false)
    expect(isPendingPage(book, '0')).toBe(false)
    expect(isPendingPage(book, '10001')).toBe(false)
    expect(isPendingPage({ ...book, pageCount: 563 }, '563')).toBe(true)
    expect(isPendingPage({ ...book, pageCount: 563 }, '564')).toBe(false)
    expect(isPendingPage({ ...book, pages: new Set() }, '5')).toBe(false)
  })

  it('counts a link to a not-yet-written page as pending, whichever way the book is named', () => {
    const canonical = '/books/answer-to-shobhat/alhad-noven-part1'
    for (const href of [`${canonical}/100`, '/Weblogs/books/alhad-noven-part1/100#x', '/books/elhad/100']) {
      expect(classifyLink(link(href), routes)).toEqual({ kind: 'pending', book: canonical, page: 100 })
    }
  })

  it('is ok for existing pages and reports a missing heading on an existing page as an error', () => {
    expect(classifyLink(link('/books/alhad-noven-part1/27#page-heading'), routes)).toEqual({ kind: 'ok' })
    expect(classifyLink(link('/books/alhad-noven-part1/27#nope'), routes)).toMatchObject({ kind: 'error' })
  })

  it('reports a page above pageCount and an unknown book as errors', () => {
    expect(classifyLink(link('/books/elhad/564'), withCount)).toMatchObject({
      kind: 'error',
      reason: expect.stringContaining('563'),
      suggestion: '/books/answer-to-shobhat/alhad-noven-part1',
    })
    expect(classifyLink(link('/books/unknown-book/10'), routes)).toMatchObject({ kind: 'error' })
    expect(classifyLink(link('/media/unknown'), routes)).toMatchObject({ kind: 'error' })
  })

  it('rewrites old-style links to a not-yet-written page to the canonical route', () => {
    const result = rewriteResolvableLinks('[x](/books/elhad/100) [y](/Weblogs/books/alhad-noven-part1/101#h)', routes)
    expect(result.markdown).toBe(
      '[x](/books/answer-to-shobhat/alhad-noven-part1/100) [y](/books/answer-to-shobhat/alhad-noven-part1/101#h)',
    )
  })
})
