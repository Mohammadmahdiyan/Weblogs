import { describe, expect, it } from 'vitest'
import { parseBlog, splitTitle, validateAliasUniqueness } from '../scripts/lib/blog.ts'

describe('splitTitle', () => {
  it('uses the first "# " line as the title and removes it from the body', () => {
    expect(splitTitle('# عنوان\n\nمتن\n\n## بخش')).toEqual({ title: 'عنوان', body: 'متن\n\n## بخش' })
  })

  it('ignores ## headings and # lines inside code fences', () => {
    const result = splitTitle('## بخش\n\n```sh\n# comment\n```\n\n# عنوان واقعی\nمتن')
    expect(result?.title).toBe('عنوان واقعی')
    expect(result?.body).toContain('# comment')
    expect(result?.body).toContain('## بخش')
  })

  it('strips inline markdown and closing hashes', () => {
    expect(splitTitle('# **عنوان** [لینک](https://a.b) #')?.title).toBe('عنوان لینک')
  })

  it('returns null without a "# " heading', () => {
    expect(splitTitle('## only h2\n\ntext')).toBeNull()
    expect(splitTitle('#nospace')).toBeNull()
  })
})

describe('parseBlog', () => {
  it('reads only tags and suggestions; the title comes from the first #', () => {
    const blog = parseBlog('---\ntags: [a, b]\nsuggestions:\n  - one\n  - two\n---\n# Title\n\nbody', 'x.md')
    expect(blog).toMatchObject({
      title: 'Title',
      tags: ['a', 'b'],
      suggestions: ['one', 'two'],
      body: 'body',
      ignoredKeys: [],
    })
  })

  it('suggestions default to the title; tags default to none', () => {
    const blog = parseBlog('# عنوان\n\nمتن', 'x.md')
    expect(blog.suggestions).toEqual(['عنوان'])
    expect(blog.tags).toEqual([])
    expect(parseBlog('---\ntags:\nsuggestions:\n---\n# T', 'x.md')).toMatchObject({ tags: [], suggestions: ['T'] })
  })

  it('parses alternate route aliases', () => {
    expect(parseBlog('---\naliases: [old-name, another-name]\n---\n# Title', 'x.md').aliases).toEqual([
      'old-name',
      'another-name',
    ])
    expect(() => parseBlog('---\naliases: [Invalid_name]\n---\n# Title', 'x.md')).toThrow(/kebab-case/)
    expect(() => parseBlog('---\naliases: [same, same]\n---\n# Title', 'x.md')).toThrow(/duplicates/)
  })

  it('parses a positive book pageCount and validates its bounds', () => {
    expect(parseBlog('---\npageCount: 563\n---\n# Book', 'book/index.md').pageCount).toBe(563)
    expect(() => parseBlog('---\npageCount: 0\n---\n# Book', 'book/index.md')).toThrow(/pageCount/)
    expect(() => parseBlog('---\npageCount: 1000000\n---\n# Book', 'book/index.md')).toThrow(/pageCount/)
    expect(() => parseBlog('---\npageCount: "563"\n---\n# Book', 'book/index.md')).toThrow(/pageCount/)
  })

  it('requires aliases to be unique across a collection and distinct from other leaf routes', () => {
    expect(() =>
      validateAliasUniqueness(
        [
          { slug: 'nested/first', aliases: ['old-name'] },
          { slug: 'other/second', aliases: ['old-name'] },
        ],
        'media',
      ),
    ).toThrow(/used more than once/)
    expect(() =>
      validateAliasUniqueness([{ slug: 'nested/first', aliases: ['second'] }, { slug: 'other/second' }], 'media'),
    ).toThrow(/conflicts with an article leaf/)
  })

  it('reports obsolete keys instead of using them', () => {
    const blog = parseBlog('---\ndraft: false\nstyle: 3\ntitle: old\n---\n# T', 'x.md')
    expect(blog.ignoredKeys).toEqual(['draft', 'style', 'title'])
    expect(blog.title).toBe('T')
  })

  it('fails with readable messages', () => {
    expect(() => parseBlog('no heading', 'x.md')).toThrow(/x\.md.*"# "/)
    expect(() => parseBlog('---\ntags: nope\n---\n# T', 'x.md')).toThrow(/tags/)
    expect(() => parseBlog('---\nreadingTime: 0\n---\n# T', 'x.md')).toThrow(/readingTime/)
  })

  it('accepts a manual readingTime', () => {
    expect(parseBlog('---\nreadingTime: 7\n---\n# T', 'x.md').readingTime).toBe(7)
  })
})

describe('show', () => {
  const page = (frontmatter: string) => `---\n${frontmatter}\n---\n\n# عنوان\n\nمتن`

  it('is true unless the article says show: false', () => {
    expect(parseBlog(page('tags: [الف]'), 'a.md').show).toBeUndefined()
    expect(parseBlog(page('show: true'), 'a.md').show).toBeUndefined()
    expect(parseBlog(page('show: false'), 'a.md').show).toBe(false)
    expect(parseBlog(page('show: false'), 'a.md').ignoredKeys).toEqual([])
  })

  it('must be true or false', () => {
    expect(() => parseBlog(page('show: "no"'), 'a.md')).toThrow('"show" must be true or false')
  })
})
