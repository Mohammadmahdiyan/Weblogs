import { describe, expect, it } from 'vitest'
import {
  buildAutoStories,
  buildStory,
  normalizeKey,
  parseSections,
  readStoryStates,
  resolveSectionLink,
  storyDayEnd,
  storyToday,
  type ArticleSource,
} from '../scripts/lib/story.ts'
import { isStoryExpired, pickStory, slideSeconds, type StoriesData, type StoryData } from '../src/lib/story.ts'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

describe('story dates', () => {
  it('ends the story day at midnight in Tehran (+03:30)', () => {
    expect(storyDayEnd('2026-10-30')).toBe('2026-10-30T20:30:00.000Z')
  })

  it('uses the Tehran calendar day, not the machine zone', () => {
    expect(storyToday(new Date('2026-10-30T20:29:00Z'))).toBe('2026-10-30')
    expect(storyToday(new Date('2026-10-30T20:31:00Z'))).toBe('2026-10-31')
  })

  it('expires exactly at the end of the day', () => {
    const story = { expiresAt: '2026-10-30T20:30:00.000Z' } as StoryData
    expect(isStoryExpired(story, Date.parse('2026-10-30T20:29:59Z'))).toBe(false)
    expect(isStoryExpired(story, Date.parse('2026-10-30T20:30:00Z'))).toBe(true)
  })
})

describe('slideSeconds', () => {
  it('keeps short stories at the base time and gives long text more, up to a minute', () => {
    expect(slideSeconds({ kind: 'image', src: 'a.jpg', textLength: 0 }, 6)).toBe(6)
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 300 }, 6)).toBe(20)
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 90000 }, 6)).toBe(60)
  })

  it('lets a story file choose its own time', () => {
    expect(slideSeconds({ kind: 'markdown', markdown: 'x', textLength: 3000, seconds: 12 }, 6)).toBe(12)
  })
})

const plain = (markdown: string) =>
  markdown
    .replace(/[#*>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const article = {
  meta: { slug: 'eid', title: 'غدیر ، عید سیاسی' },
  body: 'مقدمه\n\n## بخش یک\n\nمتن یک\n\n### زیر بخش\n\nمتن زیر\n\n## شاید بگویند\n\nمتن دو\n\n```\n## داخل کد\n```\n',
} as unknown as ArticleSource

describe('story section links', () => {
  it('splits an article at its ##–#### headings, skipping code fences', () => {
    const sections = parseSections(article.body, plain)
    expect(sections.map((section) => [section.level, section.heading])).toEqual([
      [2, 'بخش یک'],
      [3, 'زیر بخش'],
      [2, 'شاید بگویند'],
    ])
    expect(sections[0].markdown).toContain('متن زیر')
    expect(sections[2].markdown).toContain('## داخل کد')
  })

  describe('automatic stories', () => {
    const sectionBody = `## بخش اصلی

  ${'متن این بخش برای آزمودن استوری شاخه به اندازهٔ کافی طولانی است. '.repeat(5)}

  ### زیر‌بخش

  ${'این متن زیر‌بخش هم به اندازهٔ کافی طولانی است تا به‌عنوان یک اسلاید استوری انتخاب شود. '.repeat(4)}`
    const source = (slug: string, title: string, extra: Record<string, unknown> = {}, body = sectionBody) => {
      const { show, ...meta } = extra
      return {
        meta: { slug, title, ...meta },
        body,
        ...(typeof show === 'boolean' ? { show } : {}),
      } as unknown as ArticleSource
    }

    it('creates deterministic stories for each scope and eligible article branch', () => {
      const result = buildAutoStories(
        '2026-11-06',
        [
          {
            scope: 'media',
            route: '/media',
            articles: [
              source('lives-nour/spider-house/one', 'مقالهٔ خانهٔ عنکبوت', { category: 'media' }),
              source('lives-nour/motaghiya/two', 'مقالهٔ متقیه', { category: 'media' }),
              source('lives-nour/new-branch/short', 'شاخهٔ تازه', { category: 'media' }, '## کوتاه\n\nسلام'),
              source('_example-media/test', 'مقالهٔ آزمایشی', { category: 'media' }),
            ],
          },
          {
            scope: 'books',
            route: '/books',
            articles: [source('answer-to-shobhat/book-one', 'کتاب پاسخ به شبهات', { category: 'books' })],
          },
        ],
        plain,
        false,
      )

      expect(Object.keys(result.branches).sort()).toEqual([
        '/books/answer-to-shobhat',
        '/media/lives-nour/motaghiya',
        '/media/lives-nour/spider-house',
      ])
      expect(result.home?.slides).toHaveLength(1)
      expect(result.sections.media?.slides).toHaveLength(1)
      expect(result.sections.books?.slides).toHaveLength(1)
      expect(result.branches['/media/lives-nour/spider-house'].slides).toHaveLength(1)
      expect(result.branches['/media/lives-nour/spider-house'].slides[0].markdown).toMatch(/^## /)
    })

    it('filters adult, test, hidden, and production-incomplete articles', () => {
      const articles = [
        source('adult/article', 'مقالهٔ بزرگسال', { category: 'media', adult: true }),
        source('unfinished/article', 'مقالهٔ ناتمام', { category: 'media', incomplete: true }),
        source('hidden/article', 'مقالهٔ پنهان', { category: 'media', show: false }),
        source('_example-media/test', 'مقالهٔ آزمایشی', { category: 'media' }),
        source('eligible/article', 'مقالهٔ واجد شرایط', { category: 'media' }),
      ]
      const development = buildAutoStories('2026-11-06', [{ scope: 'media', route: '/media', articles }], plain, false)

      const production = buildAutoStories('2026-11-06', [{ scope: 'media', route: '/media', articles }], plain, true)
      expect(Object.keys(development.branches).sort()).toEqual(['/media/eligible', '/media/unfinished'])
      expect(Object.keys(production.branches)).toEqual(['/media/eligible'])
      expect(production.home?.slides[0].kicker).toBe('مقالهٔ واجد شرایط')
    })

    it('requires a level-two section with 140–4000 markdown characters', () => {
      const long = 'این متن برای ارزیابی انتخاب بخش‌های استوری به اندازه کافی طولانی است. '.repeat(5)
      const body = [
        `## معتبر\n\n${long}`,
        '## کوتاه\n\nمتن کوتاه',
        `### تیتر سطح سه\n\n${long}`,
        `## بیش از اندازه بلند\n\n${'الف'.repeat(4001)}`,
      ].join('\n\n')
      const result = buildAutoStories(
        '2026-11-06',
        [{ scope: 'media', route: '/media', articles: [source('article', 'مقاله', { category: 'media' }, body)] }],
        plain,
        false,
      )

      expect(result.branches['/media'].slides[0].markdown).toMatch(/^## معتبر/)
    })
  })

  it('finds `article / section` by title or folder name, ignoring ZWNJ and Arabic letter variants', () => {
    expect(resolveSectionLink('غدیر ، عید سیاسی/شاید بگویند', [article], plain, 'x')?.section.heading).toBe(
      'شاید بگویند',
    )
    expect(resolveSectionLink('eid / شايد بگويند', [article], plain, 'x')?.section.heading).toBe('شاید بگویند')
  })

  it('resolves full nested paths across categories and rejects adult content as a story', async () => {
    const nestedBook = {
      meta: { slug: 'answer-to-shobhat/volume-one', title: 'پاسخ به شبهات', category: 'books' },
      body: '## فصل نخست\n\nمتن فصل',
    } as unknown as ArticleSource
    const adultArticle = {
      meta: { slug: 'private/article', title: 'مقالهٔ بزرگسال', category: 'media', adult: true },
      body: '## پنهان\n\nمتن پنهان',
    } as unknown as ArticleSource
    expect(
      resolveSectionLink('books/answer-to-shobhat/volume-one/فصل نخست', [nestedBook], plain, 'story/link.md')?.article
        .meta.category,
    ).toBe('books')
    const directory = await mkdtemp(path.join(os.tmpdir(), 'story-adult-'))
    const mediaDirectory = `story-media-test-${process.pid}-${Date.now()}`
    await writeFile(path.join(directory, 'adult-link.md'), '---\nblog: media/private/article/پنهان\n---\n')
    try {
      await expect(
        buildStory({
          scope: 'home',
          date: storyToday(),
          isProduction: false,
          baseUrl: '/Weblogs/',
          articles: [adultArticle],
          plainText: plain,
          storyDir: directory,
          mediaDirectory,
        }),
      ).rejects.toThrow(/18\+/)
    } finally {
      await rm(directory, { recursive: true, force: true })
      await rm(path.resolve('public', mediaDirectory), { recursive: true, force: true })
    }
  })

  function makeStory(
    id: string,
    source: StoryData['source'] = 'article',
    expiresAt = '2099-01-01T00:00:00.000Z',
    hidden = false,
  ): StoryData {
    return {
      id,
      source,
      date: '2098-12-31',
      expiresAt,
      ...(hidden ? { hidden: true } : {}),
      slides: hidden ? [] : [{ kind: 'markdown', markdown: id, textLength: id.length }],
    }
  }

  describe('pickStory', () => {
    const home = makeStory('home')
    const mediaAuto = makeStory('media-auto')
    const booksAuto = makeStory('books-auto')
    const stories: StoriesData = {
      home,
      sections: { media: mediaAuto, books: booksAuto },
      branches: {
        '/media/lives-nour': makeStory('media-parent'),
        '/media/lives-nour/spider-house': makeStory('media-deepest'),
        '/books/answer-to-shobhat': makeStory('books-parent'),
        '/books/answer-to-shobhat/book-one': makeStory('book-directory'),
      },
    }

    it('uses the deepest parent directory for an article route', () => {
      expect(pickStory('/media/lives-nour/spider-house/article', stories)?.id).toBe('media-deepest')
    })

    it('uses the book parent for a numbered book page', () => {
      expect(pickStory('/books/answer-to-shobhat/book-one/27', stories)?.id).toBe('books-parent')
    })

    it('falls back to the scope story and then home for unknown or empty scopes', () => {
      expect(pickStory('/media/unmatched', { ...stories, branches: {} })?.id).toBe('media-auto')
      expect(pickStory('/books/unmatched', { ...stories, sections: { ...stories.sections, books: null } })?.id).toBe(
        'home',
      )
      expect(pickStory('/unknown/route', stories)?.id).toBe('home')
      expect(pickStory('/', stories)?.id).toBe('home')
    })

    it('prefers a live manual scope story but lets an expired one fall through', () => {
      const manual = makeStory('manual-media', 'custom')
      const manualStories = { ...stories, sections: { ...stories.sections, media: manual } }
      expect(pickStory('/media/unmatched', manualStories)?.id).toBe('manual-media')
      const expiredStories = {
        ...manualStories,
        sections: {
          ...manualStories.sections,
          media: {
            ...makeStory('expired-manual', 'custom', '2020-01-01T00:00:00.000Z'),
            fallback: mediaAuto,
          },
        },
      }
      expect(pickStory('/media/unmatched', expiredStories)?.id).toBe('media-auto')
      const expiredHome = {
        ...stories,
        home: { ...makeStory('expired-home-manual', 'custom', '2020-01-01T00:00:00.000Z'), fallback: home },
      }
      expect(pickStory('/', expiredHome)?.id).toBe('home')
    })

    it('does not use an automatic fallback when the manual scope is hidden', () => {
      const hiddenStories = {
        ...stories,
        sections: {
          ...stories.sections,
          media: {
            ...makeStory('hidden', 'custom', '2099-01-01T00:00:00.000Z', true),
            fallback: mediaAuto,
          },
        },
      }
      expect(pickStory('/media/unmatched', hiddenStories)).toBeNull()
    })
  })

  describe('story scope state migration', () => {
    it('migrates the old home and per-scope state files into one state map and removes them', async () => {
      const directory = await mkdtemp(path.join(os.tmpdir(), 'story-state-'))
      const stateFile = path.join(directory, 'content', 'story-state.json')
      const legacy = {
        media: path.join(directory, 'content', 'media-story-state.json'),
        books: path.join(directory, 'content', 'books-story-state.json'),
      }
      await mkdir(path.dirname(stateFile), { recursive: true })
      await writeFile(stateFile, JSON.stringify({ date: '2026-11-08', publishedAt: 'home-time' }))
      await writeFile(legacy.media, JSON.stringify({ date: '2026-11-07', publishedAt: 'media-time' }))
      await writeFile(legacy.books, JSON.stringify({ date: '2026-11-06', publishedAt: 'books-time' }))

      try {
        const states = await readStoryStates(stateFile, legacy)
        expect(states).toEqual({
          home: { date: '2026-11-08', publishedAt: 'home-time' },
          media: { date: '2026-11-07', publishedAt: 'media-time' },
          books: { date: '2026-11-06', publishedAt: 'books-time' },
        })
        expect(JSON.parse(await readFile(stateFile, 'utf8'))).toEqual(states)
        await expect(readFile(legacy.media)).rejects.toMatchObject({ code: 'ENOENT' })
        await expect(readFile(legacy.books)).rejects.toMatchObject({ code: 'ENOENT' })
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })

    it('marks a published scope with only show:false slides as hidden', async () => {
      const directory = await mkdtemp(path.join(os.tmpdir(), 'story-hidden-'))
      const mediaDirectory = `story-media-test-${process.pid}-${Date.now()}`
      await writeFile(path.join(directory, 'hidden.md'), '---\nshow: false\n---\nمتن پنهان')
      try {
        const story = await buildStory({
          scope: 'home',
          date: '2026-11-08',
          isProduction: true,
          baseUrl: '/Weblogs/',
          articles: [],
          plainText: plain,
          state: { date: '2026-11-08', publishedAt: 'test' },
          storyDir: directory,
          mediaDirectory,
        })
        expect(story).toMatchObject({ source: 'custom', hidden: true, slides: [] })
      } finally {
        await rm(directory, { recursive: true, force: true })
        await rm(path.resolve('public', mediaDirectory), { recursive: true, force: true })
      }
    })
  })

  it('is not a link when no article matches, and explains a missing section', () => {
    expect(resolveSectionLink('و/یا', [article], plain, 'x')).toBeNull()
    expect(() => resolveSectionLink('eid/ناموجود', [article], plain, 'story/a.md')).toThrow(/بخش یک/)
  })

  it('normalizes text for comparison', () => {
    expect(normalizeKey('  شايد‌ بگويند؟ ')).toBe(normalizeKey('شاید بگویند'))
  })
})
