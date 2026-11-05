/*
  Daily story (the ring in the header).

  Author flow:
    1. put story files in /story
    2. `npm run publishStory`            → the story is for TODAY (Asia/Tehran), committed and pushed
    3. the next day it disappears: the daily GitHub Actions run deletes everything in /story
       (`npm run cleanStory`), and even if that run is late the build ignores an old story.
  Nothing in /story → a section of a random article is shown instead (the same one all day).

  ONE FILE = ONE STORY (a segment of the progress bar). Files are shown in name order (numbers sort naturally):
    index.md                   → one story
    index.md index1.md index2.md → three stories
  A story file is ordinary Markdown (text, **bold**, quotes, ||spoilers||, images, links …) and scrolls when it is
  long. Pictures it uses (`![](./photo.jpg)`) live in /story too. A picture file no .md uses becomes a story by
  itself (full-screen picture).

  Optional frontmatter in a story file:
    show: false          the story ring is not shown at all that day (the files are still deleted after the day)
    blog: <article>/<section>   show a section of a blog article instead of the file's own text, e.g.
                         blog: غدیر ، عید سیاسی/شاید بگویند      (article title or folder name / heading text)
                         The same line alone as the file's whole text works too.
    seconds: 12          how long this story stays (default: automatic from the text length)

  State lives OUTSIDE the folder (content/story-state.json) because the folder is wiped.
*/
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import type { ArticleMeta } from '../../src/lib/types.ts'
import type { StoryData, StorySlide } from '../../src/lib/story.ts'
import { isTestFolder } from './blog.ts'
import { encodeMediaPath, isAbsoluteUrl, normalizeMediaPath, prepareVideoForBrowser } from './media.ts'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const storyRoot = path.join(projectRoot, 'story')
export const storyStateFile = path.join(projectRoot, 'content', 'story-state.json')
const storyMediaRoot = path.join(projectRoot, 'public', 'story-media')
const generatedStoryFile = path.join(projectRoot, 'src', 'generated', 'story.json')

const STORY_TIME_ZONE = 'Asia/Tehran'
/** Iran has no daylight saving time since 2022, so the offset is fixed. */
const STORY_UTC_OFFSET = '+03:30'
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'])
const mediaCacheRoot = path.join(projectRoot, '.cache', 'media')

// ───────────────────────── dates ─────────────────────────

/** Today's date (YYYY-MM-DD) in the story time zone, independent of the machine's own zone. */
export function storyToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** The moment the given story day ends: midnight at the end of that date in the story time zone. */
export function storyDayEnd(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00${STORY_UTC_OFFSET}`) + 24 * 60 * 60 * 1000).toISOString()
}

// ───────────────────────── state ─────────────────────────

export interface StoryState {
  date: string
  publishedAt: string
}

export async function readStoryState(file = storyStateFile): Promise<StoryState | null> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<StoryState>
    if (typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      return { date: parsed.date, publishedAt: typeof parsed.publishedAt === 'string' ? parsed.publishedAt : '' }
    }
    return null
  } catch {
    return null
  }
}

export async function writeStoryState(state: StoryState | null, file = storyStateFile): Promise<void> {
  if (state === null) {
    await rm(file, { force: true })
    return
  }
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

// ───────────────────────── folder ─────────────────────────

const naturalCompare = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare

export interface StoryMarkdownFile {
  name: string
  data: Record<string, unknown>
  body: string
}

export interface StoryFolder {
  /** Every .md file at the top of /story. */
  markdown: StoryMarkdownFile[]
  /** Every picture file at the top of /story (some may be used inside .md files). */
  images: string[]
  /** Every file under /story (posix paths relative to it): the pool the .md files can point to. */
  files: Set<string>
}

async function walkFiles(directory: string, prefix = ''): Promise<string[]> {
  const found: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) found.push(...(await walkFiles(path.join(directory, entry.name), relative)))
    else if (entry.isFile()) found.push(relative)
  }
  return found
}

export async function readStoryFolder(directory = storyRoot): Promise<StoryFolder> {
  let all: string[]
  try {
    all = (await walkFiles(directory)).sort(naturalCompare)
  } catch {
    return { markdown: [], images: [], files: new Set() }
  }
  const top = all.filter((name) => !name.includes('/'))
  const markdown: StoryMarkdownFile[] = []
  for (const name of top.filter((file) => path.extname(file).toLowerCase() === '.md')) {
    const source = (await readFile(path.join(directory, name), 'utf8')).replace(/^\uFEFF/, '')
    try {
      const parsed = matter(source)
      markdown.push({ name, data: parsed.data as Record<string, unknown>, body: parsed.content.trim() })
    } catch (error) {
      throw new Error(
        `story/${name}: invalid frontmatter (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`,
        { cause: error },
      )
    }
  }
  return {
    markdown,
    images: top.filter((file) => imageExtensions.has(path.extname(file).toLowerCase())),
    files: new Set(all),
  }
}

export function storyFolderHasContent(folder: StoryFolder): boolean {
  return folder.markdown.length > 0 || folder.images.length > 0
}

/** Deletes everything inside /story (keeping the folder itself, with a .gitkeep so Git keeps it). */
export async function emptyStoryFolder(directory = storyRoot): Promise<number> {
  let removed = 0
  try {
    for (const name of await readdir(directory)) {
      if (name === '.gitkeep') continue
      await rm(path.join(directory, name), { recursive: true, force: true })
      removed += 1
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, '.gitkeep'), '', 'utf8')
  return removed
}

/**
 * Removes yesterday's (or older) story: the folder contents and the state file. Safe to run any time; returns
 * true when something was removed. A folder that was never published (a draft) is left alone.
 */
export async function cleanExpiredStory(
  force = false,
  stateFile = storyStateFile,
  directory = storyRoot,
): Promise<boolean> {
  const state = await readStoryState(stateFile)
  if (!force && (!state || state.date >= storyToday())) return false
  const removed = await emptyStoryFolder(directory)
  await writeStoryState(null, stateFile)
  return removed > 0 || state !== null
}

// ───────────────────────── article sections ─────────────────────────

/** Comparison key for Persian / Arabic text: same letters, no ZWNJ, diacritics, punctuation or case differences. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\u200c/g, '')
    .replace(/\u200d/g, '')
    .replace(/\u0640/g, '')
    .replace(/\p{M}/gu, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export interface ArticleSection {
  level: number
  /** Heading text without markup. */
  heading: string
  /** The section as Markdown: its heading line, then everything up to the next heading of the same or a higher level. */
  markdown: string
}

/** Splits a Markdown body at its `##`…`####` headings (fenced code is skipped). */
export function parseSections(body: string, plainText: (markdown: string) => string): ArticleSection[] {
  const lines = body.split(/\r?\n/)
  const headings: { index: number; level: number; raw: string }[] = []
  let fence: string | null = null
  lines.forEach((line, index) => {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fence === null) fence = marker
      else if (fence === marker) fence = null
      return
    }
    if (fence !== null) return
    const heading = line.match(/^(#{2,4})[ \t]+(.+?)[ \t]*#*[ \t]*$/)
    if (heading) headings.push({ index, level: heading[1].length, raw: heading[2] })
  })

  return headings.map((heading, position) => {
    const end = headings.slice(position + 1).find((next) => next.level <= heading.level)?.index ?? lines.length
    return {
      level: heading.level,
      heading: plainText(heading.raw),
      markdown: lines.slice(heading.index, end).join('\n').trim(),
    }
  })
}

export interface ArticleSource {
  meta: ArticleMeta
  body: string
}

/** Finds an article by its folder name or title (exact first, then a unique partial match). */
function findArticle(articles: ArticleSource[], query: string): ArticleSource | null {
  const key = normalizeKey(query)
  if (!key) return null
  const exact = articles.filter(({ meta }) => normalizeKey(meta.slug) === key || normalizeKey(meta.title) === key)
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) return null
  const partial = articles.filter(({ meta }) => normalizeKey(meta.title).includes(key))
  return partial.length === 1 ? partial[0] : null
}

function findSection(sections: ArticleSection[], query: string): ArticleSection | null {
  const key = normalizeKey(query)
  if (!key) return null
  const exact = sections.filter((section) => normalizeKey(section.heading) === key)
  if (exact.length > 0) return exact[0]
  const partial = sections.filter((section) => normalizeKey(section.heading).includes(key))
  return partial.length === 1 ? partial[0] : null
}

/**
 * `article title / section heading` → that section. Every `/` is tried as the separator, so titles and headings
 * that contain a slash still work. Returns null when no article matches (not an article link at all); throws when
 * the article exists but the section does not, listing the headings you can use.
 */
export function resolveSectionLink(
  reference: string,
  articles: ArticleSource[],
  plainText: (markdown: string) => string,
  where: string,
): { article: ArticleSource; section: ArticleSection } | null {
  for (let index = reference.indexOf('/'); index !== -1; index = reference.indexOf('/', index + 1)) {
    const article = findArticle(articles, reference.slice(0, index))
    if (!article) continue
    const sections = parseSections(article.body, plainText)
    const section = findSection(sections, reference.slice(index + 1))
    if (section) return { article, section }
    const available = sections.map((item) => `  - ${item.heading}`).join('\n') || '  (the article has no ## sections)'
    throw new Error(
      `${where}: article "${article.meta.title}" has no section "${reference.slice(index + 1).trim()}". Sections you can use:\n${available}`,
    )
  }
  return null
}

// ───────────────────────── fallback: a section of a random article ─────────────────────────

/** Small deterministic random generator: the same date always picks the same article and section. */
function seededRandom(seed: string): () => number {
  let hash = 1779033703 ^ seed.length
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }
  let state = hash >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function articleStory(
  date: string,
  articles: ArticleSource[],
  plainText: (markdown: string) => string,
  isProduction: boolean,
  articleRoute = '/media',
): StoryData | null {
  const random = seededRandom(date)
  // Never: test articles (`_…` folders), adult-gated articles. In production also unfinished ones.
  const pool = articles.filter(
    ({ meta }) => !isTestFolder(meta.slug) && !meta.adult && (!isProduction || !meta.incomplete),
  )
  const order = [...pool].sort((left, right) => left.meta.slug.localeCompare(right.meta.slug))
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }

  for (const article of order) {
    // Whole `##` sections that read well on their own: enough text, not so long that a story becomes a chapter.
    const sections = parseSections(article.body, plainText).filter((section) => {
      if (section.level !== 2 || section.markdown.length > 4000) return false
      return plainText(section.markdown).length >= 140
    })
    if (sections.length === 0) continue
    const section = sections[Math.floor(random() * sections.length)]
    return {
      id: `${date}:article:${article.meta.slug}`,
      source: 'article',
      date,
      expiresAt: storyDayEnd(date),
      slides: [sectionSlide(article, section, plainText, articleRoute)],
    }
  }
  return null
}

function sectionSlide(
  article: ArticleSource,
  section: ArticleSection,
  plainText: (markdown: string) => string,
  articleRoute?: string,
): StorySlide {
  const route = articleRoute ?? `/${article.meta.category ?? 'media'}`
  return {
    kind: 'markdown',
    markdown: section.markdown,
    kicker: article.meta.title,
    link: { href: `${route}/${article.meta.slug}?find=${encodeURIComponent(section.heading)}`, label: 'خواندن مقاله' },
    textLength: plainText(section.markdown).length,
  }
}

// ───────────────────────── the owner's story folder ─────────────────────────

const knownKeys = new Set(['show', 'blog', 'seconds'])
const SINGLE_IMAGE = /^!\[[^\]]*\]\(\s*<?([^)\s>]+)>?\s*\)$/

/** Points relative media URLs (`./photo.jpg`) at the published copy and records which story files are used. */
function rewriteStoryMedia(
  markdown: string,
  files: Set<string>,
  baseUrl: string,
  used: Set<string>,
  mediaDirectory: string,
): string {
  const rewrite = (url: string): string => {
    if (isAbsoluteUrl(url)) return url
    const suffixAt = url.search(/[?#]/)
    const pathPart = suffixAt === -1 ? url : url.slice(0, suffixAt)
    const suffix = suffixAt === -1 ? '' : url.slice(suffixAt)
    const normalized = normalizeMediaPath(pathPart)
    if (!files.has(normalized)) return url
    used.add(normalized)
    return `${baseUrl}${mediaDirectory}/${encodeMediaPath(normalized)}${suffix}`
  }
  return markdown
    .replace(/(!?\[[^\]]*\]\(\s*<?)([^)\s>]+)/g, (_match, before: string, url: string) => `${before}${rewrite(url)}`)
    .replace(
      /\b(src|poster)(\s*=\s*)(["'])([^"']+)\3/g,
      (_match, key: string, equals: string, quote: string, url: string) =>
        `${key}${equals}${quote}${rewrite(url)}${quote}`,
    )
}

async function publishStoryMedia(
  files: Iterable<string>,
  sourceRoot = storyRoot,
  destinationRoot = storyMediaRoot,
): Promise<void> {
  for (const relative of files) {
    const source = path.join(sourceRoot, ...relative.split('/'))
    const destination = path.join(destinationRoot, ...relative.split('/'))
    await mkdir(path.dirname(destination), { recursive: true })
    if (/\.(mp4|m4v|mov)$/i.test(relative)) {
      const prepared = await prepareVideoForBrowser(source, mediaCacheRoot)
      await copyFile(prepared.filePath, destination)
      if (prepared.message) console.warn(`[story] ${relative}: ${prepared.message}`)
    } else {
      await copyFile(source, destination)
    }
    const size = (await stat(destination)).size
    if (size > 2_500_000)
      console.warn(`[story] ${relative}: ${(size / 1_000_000).toFixed(1)} MB: compress it, phones download every file.`)
  }
}

interface FolderStories {
  slides: StorySlide[]
  /** false when every file said `show: false`. */
  anyVisible: boolean
}

async function slidesFromFolder(folder: StoryFolder, options: BuildStoryOptions): Promise<FolderStories> {
  const used = new Set<string>()
  const entries: { name: string; slide: StorySlide | null }[] = []

  for (const file of folder.markdown) {
    const where = `story/${file.name}`
    const unknown = Object.keys(file.data).filter((key) => !knownKeys.has(key))
    if (unknown.length > 0)
      console.warn(`[story] ${where}: ignored frontmatter key(s) ${unknown.join(', ')} (known: show, blog, seconds)`)
    if (file.data.show === false) {
      entries.push({ name: file.name, slide: null })
      continue
    }

    const seconds = typeof file.data.seconds === 'number' && file.data.seconds > 0 ? file.data.seconds : undefined
    try {
      // 1. a link to a section of a blog article (frontmatter `blog:` or the file's whole text on one line)
      const reference =
        typeof file.data.blog === 'string'
          ? file.data.blog
          : file.body && !file.body.includes('\n') && file.body.includes('/')
            ? file.body
            : null
      if (reference !== null) {
        const linked = resolveSectionLink(reference, options.articles, options.plainText, where)
        if (linked) {
          if (linked.article.meta.adult)
            throw new Error(
              `${where}: "${linked.article.meta.title}" is an 18+ article; its text cannot be shown in a story.`,
            )
          entries.push({
            name: file.name,
            slide: {
              ...sectionSlide(linked.article, linked.section, options.plainText, options.articleRoute),
              ...(seconds ? { seconds } : {}),
            },
          })
          continue
        }
        if (typeof file.data.blog === 'string')
          throw new Error(
            `${where}: no article matches "blog: ${file.data.blog}". Write the article's title or folder name, then / and the section heading.`,
          )
      }

      // 2. the file's own Markdown
      if (!file.body) throw new Error(`${where}: the story is empty.`)
      const markdown = rewriteStoryMedia(
        file.body,
        folder.files,
        options.baseUrl,
        used,
        options.mediaDirectory ?? 'story-media',
      )
      const single = markdown.match(SINGLE_IMAGE)
      if (single && single[1].startsWith(`${options.baseUrl}story-media/`)) {
        entries.push({
          name: file.name,
          slide: { kind: 'image', src: single[1], textLength: 0, ...(seconds ? { seconds } : {}) },
        })
      } else {
        entries.push({
          name: file.name,
          slide: {
            kind: 'markdown',
            markdown,
            textLength: options.plainText(markdown).length,
            ...(seconds ? { seconds } : {}),
          },
        })
      }
    } catch (error) {
      // Development and publishing stop here so the mistake is fixed; the daily production build only skips it.
      if (!options.isProduction) throw error
      console.warn(`[story] skipped: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Pictures no .md file uses are stories of their own.
  for (const image of folder.images) {
    if (used.has(image)) continue
    used.add(image)
    entries.push({
      name: image,
      slide: {
        kind: 'image',
        src: `${options.baseUrl}${options.mediaDirectory ?? 'story-media'}/${encodeMediaPath(image)}`,
        textLength: 0,
      },
    })
  }

  const unusedOther = [...folder.files].filter(
    (name) => !used.has(name) && !name.includes('/') && path.extname(name).toLowerCase() !== '.md',
  )
  if (unusedOther.length > 0)
    console.warn(`[story] not used by any story (only pictures and .md files make stories): ${unusedOther.join(', ')}`)

  entries.sort((left, right) => naturalCompare(left.name, right.name))
  await publishStoryMedia(
    used,
    options.storyDir ?? storyRoot,
    path.join(projectRoot, 'public', options.mediaDirectory ?? 'story-media'),
  )
  const slides = entries.flatMap((entry) => (entry.slide ? [entry.slide] : []))
  return { slides, anyVisible: slides.length > 0 }
}

// ───────────────────────── build step ─────────────────────────

export interface BuildStoryOptions {
  isProduction: boolean
  /** Site base, e.g. `/Weblogs/`. */
  baseUrl: string
  articles: ArticleSource[]
  plainText: (markdown: string) => string
  storyDir?: string
  stateFile?: string
  generatedFile?: string
  mediaDirectory?: string
  articleRoute?: string
}

/** Writes src/generated/story.json (`null` = no story) and copies the story media to public/story-media. */
export async function buildStory(options: BuildStoryOptions): Promise<StoryData | null> {
  const today = storyToday()
  const storyDir = options.storyDir ?? storyRoot
  const generatedFile = options.generatedFile ?? generatedStoryFile
  const mediaDirectory = options.mediaDirectory ?? 'story-media'
  const mediaRoot = path.join(projectRoot, 'public', mediaDirectory)
  const state = await readStoryState(options.stateFile)
  const folder = await readStoryFolder(storyDir)
  await rm(mediaRoot, { recursive: true, force: true })

  let story: StoryData | null = null
  const publishedToday = state?.date === today
  // Production shows the owner's story only when it was published today. Development also previews a draft.
  const useFolder = storyFolderHasContent(folder) && (publishedToday || (!options.isProduction && state === null))

  if (useFolder) {
    const { slides, anyVisible } = await slidesFromFolder(folder, { ...options, mediaDirectory })
    // The folder claims the day: when every file is `show: false` nothing (not even a random article) is shown.
    if (anyVisible) {
      story = {
        id: `${today}:custom:${options.articleRoute ?? 'global'}:${state?.publishedAt || 'draft'}`,
        source: 'custom',
        date: today,
        expiresAt: storyDayEnd(today),
        ...(publishedToday ? {} : { preview: true }),
        slides,
      }
    } else {
      console.log('Story: hidden for today (every story file has `show: false`).')
    }
  } else {
    story = articleStory(today, options.articles, options.plainText, options.isProduction, options.articleRoute)
    if (storyFolderHasContent(folder) && state !== null && state.date < today) {
      console.warn(
        '[story] /story holds an old story that is no longer shown; `npm run cleanStory` deletes it (done automatically every day on GitHub).',
      )
    }
  }

  await mkdir(path.dirname(generatedFile), { recursive: true })
  await writeFile(generatedFile, `${JSON.stringify(story, null, 2)}\n`, 'utf8')
  if (story)
    console.log(
      `Story: ${story.source} · ${story.slides.length} stor${story.slides.length === 1 ? 'y' : 'ies'}${story.preview ? ' (draft preview)' : ''}`,
    )
  return story
}
