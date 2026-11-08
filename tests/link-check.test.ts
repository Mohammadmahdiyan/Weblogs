import { describe, expect, it } from 'vitest'
import {
  extractHeadingIds,
  extractInternalLinks,
  resolveContentRoute,
  rewriteResolvableLinks,
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
