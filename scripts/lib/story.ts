/*
  Daily story (the ring in the header).

  Author flow:
    1. put pictures and one .md file in /story
    2. `npm run publishStory`            → the story is for TODAY (Asia/Tehran), committed and pushed
    3. the next day it disappears: the daily GitHub Actions run deletes everything in /story
       (`npm run cleanStory`), and even if that run is late the build ignores an old story.
  Nothing in /story → a section of a random article is shown instead (the same one all day).

  /story contents:
    pictures  jpg jpeg png webp gif avif svg, shown in file-name order (1.jpg, 2.jpg … ; numbers sort naturally)
    .md       the captions. Split captions with a line containing only ---
              caption 1 → picture 1, caption 2 → picture 2 … Extra captions become text slides.
              Pictures without a caption are simply shown.

  State lives OUTSIDE the folder (content/story-state.json) because the folder is wiped.
*/
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ArticleMeta } from '../../src/lib/types.ts'
import type { StoryData, StorySlide } from '../../src/lib/story.ts'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const storyRoot = path.join(projectRoot, 'story')
export const storyStateFile = path.join(projectRoot, 'content', 'story-state.json')
const storyMediaRoot = path.join(projectRoot, 'public', 'story-media')
const generatedStoryFile = path.join(projectRoot, 'src', 'generated', 'story.json')

const STORY_TIME_ZONE = 'Asia/Tehran'
/** Iran has no daylight saving time since 2022, so the offset is fixed. */
const STORY_UTC_OFFSET = '+03:30'
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'])

// ───────────────────────── dates ─────────────────────────

/** Today's date (YYYY-MM-DD) in the story time zone, independent of the machine's own zone. */
export function storyToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STORY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
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

export async function readStoryState(): Promise<StoryState | null> {
  try {
    const parsed = JSON.parse(await readFile(storyStateFile, 'utf8')) as Partial<StoryState>
    if (typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      return { date: parsed.date, publishedAt: typeof parsed.publishedAt === 'string' ? parsed.publishedAt : '' }
    }
    return null
  } catch {
    return null
  }
}

export async function writeStoryState(state: StoryState | null): Promise<void> {
  if (state === null) {
    await rm(storyStateFile, { force: true })
    return
  }
  await mkdir(path.dirname(storyStateFile), { recursive: true })
  await writeFile(storyStateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

// ───────────────────────── folder ─────────────────────────

const naturalCompare = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare

export interface StoryFolder {
  images: string[]
  captions: string[]
  /** Files that are neither pictures nor .md (ignored, but worth a warning). */
  ignored: string[]
}

export async function readStoryFolder(): Promise<StoryFolder> {
  let entries: string[]
  try {
    entries = (await readdir(storyRoot, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch {
    return { images: [], captions: [], ignored: [] }
  }
  const visible = entries.filter((name) => !name.startsWith('.')).sort(naturalCompare)
  const images = visible.filter((name) => imageExtensions.has(path.extname(name).toLowerCase()))
  const markdown = visible.filter((name) => path.extname(name).toLowerCase() === '.md')
  const ignored = visible.filter((name) => !images.includes(name) && !markdown.includes(name))

  const captions: string[] = []
  for (const name of markdown) {
    const text = (await readFile(path.join(storyRoot, name), 'utf8')).replace(/^\uFEFF/, '')
    for (const part of text.split(/^[ \t]*---[ \t]*$/m)) {
      const caption = part.trim()
      if (caption) captions.push(caption)
    }
  }
  return { images, captions, ignored }
}

export function storyFolderHasContent(folder: StoryFolder): boolean {
  return folder.images.length > 0 || folder.captions.length > 0
}

/** Deletes everything inside /story (keeping the folder itself, with a .gitkeep so Git keeps it). */
export async function emptyStoryFolder(): Promise<number> {
  let removed = 0
  try {
    for (const name of await readdir(storyRoot)) {
      if (name === '.gitkeep') continue
      await rm(path.join(storyRoot, name), { recursive: true, force: true })
      removed += 1
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(storyRoot, { recursive: true })
  await writeFile(path.join(storyRoot, '.gitkeep'), '', 'utf8')
  return removed
}

/**
 * Removes yesterday's (or older) story: the folder contents and the state file. Safe to run any time; returns
 * true when something was removed. A folder that was never published (a draft) is left alone.
 */
export async function cleanExpiredStory(force = false): Promise<boolean> {
  const state = await readStoryState()
  if (!force && (!state || state.date >= storyToday())) return false
  const removed = await emptyStoryFolder()
  await writeStoryState(null)
  return removed > 0 || state !== null
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

interface Section {
  heading: string
  text: string
}

/** Splits an article body at its `## ` headings and keeps sections that read well on their own. */
function readableSections(body: string, plainText: (markdown: string) => string): Section[] {
  const sections: Section[] = []
  let fence: string | null = null
  let heading: string | null = null
  let lines: string[] = []

  const flush = () => {
    if (heading === null) return
    const raw = lines.join('\n')
    // Never put censored (||spoiler||) or 18+ wording into a story, and skip sections made of embeds / components.
    if (/\|\|/.test(raw) || /\{متن انیمیشن/.test(raw)) return
    const text = plainText(raw)
    if (text.length >= 140) sections.push({ heading: plainText(heading), text })
  }

  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fence === null) fence = marker
      else if (fence === marker) fence = null
    }
    const heading2 = fence === null ? line.match(/^##[ \t]+(.+?)[ \t]*#*[ \t]*$/) : null
    if (heading2) {
      flush()
      heading = heading2[1]
      lines = []
    } else {
      lines.push(line)
    }
  }
  flush()
  return sections
}

/** About `max` characters, cut at the end of a sentence when possible, else at a word. */
function excerpt(text: string, max = 380): string {
  if (text.length <= max) return text
  const window = text.slice(0, max)
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('؟ '), window.lastIndexOf('! '), window.lastIndexOf('؛ '))
  if (sentenceEnd >= max * 0.55) return window.slice(0, sentenceEnd + 1).trim()
  const wordEnd = window.lastIndexOf(' ')
  return `${window.slice(0, wordEnd > 0 ? wordEnd : max).trim()}…`
}

interface FallbackInput {
  meta: ArticleMeta
  body: string
}

function articleStory(date: string, articles: FallbackInput[], plainText: (markdown: string) => string, isProduction: boolean): StoryData | null {
  const random = seededRandom(date)
  // Adult-gated articles never appear; in production unfinished articles don't either.
  const pool = articles.filter(({ meta }) => !meta.adult && (!isProduction || !meta.incomplete))
  const order = [...pool].sort((left, right) => left.meta.slug.localeCompare(right.meta.slug))
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }

  for (const { meta, body } of order) {
    const sections = readableSections(body, plainText)
    if (sections.length === 0) continue
    const section = sections[Math.floor(random() * sections.length)]
    const cover = meta.cover?.type === 'image' ? meta.cover.url : undefined
    const href = `/blog/${meta.slug}?find=${encodeURIComponent(section.heading)}`
    return {
      id: `${date}:article:${meta.slug}`,
      source: 'article',
      date,
      expiresAt: storyDayEnd(date),
      slides: [
        { kind: 'text', kicker: 'از مقاله‌های وبلاگ', title: meta.title, caption: section.heading, ...(cover ? { src: cover } : {}) },
        { kind: 'text', kicker: section.heading, caption: excerpt(section.text) },
        { kind: 'link', title: 'ادامه را در خود مقاله بخوانید', link: { href, label: 'خواندن مقاله' } },
      ],
    }
  }
  return null
}

// ───────────────────────── build step ─────────────────────────

export interface BuildStoryOptions {
  isProduction: boolean
  /** Site base, e.g. `/Weblogs/`. */
  baseUrl: string
  articles: FallbackInput[]
  plainText: (markdown: string) => string
}

/** Writes src/generated/story.json (`null` = no story) and copies the story pictures to public/story-media. */
export async function buildStory(options: BuildStoryOptions): Promise<StoryData | null> {
  const today = storyToday()
  const state = await readStoryState()
  const folder = await readStoryFolder()
  await rm(storyMediaRoot, { recursive: true, force: true })

  let story: StoryData | null = null
  const publishedToday = state?.date === today
  // Production shows the owner's story only when it was published today. Development also previews a draft.
  const useCustom = storyFolderHasContent(folder) && (publishedToday || (!options.isProduction && state === null))

  if (useCustom) {
    const date = today
    const slides: StorySlide[] = []
    const count = Math.max(folder.images.length, folder.captions.length)
    for (let index = 0; index < count; index += 1) {
      const image = folder.images[index]
      const caption = folder.captions[index]
      if (image) {
        const destination = path.join(storyMediaRoot, image)
        await mkdir(path.dirname(destination), { recursive: true })
        await copyFile(path.join(storyRoot, image), destination)
        const size = (await stat(destination)).size
        if (size > 2_500_000) console.warn(`[story] ${image}: ${(size / 1_000_000).toFixed(1)} MB: compress it, phones download every picture.`)
        slides.push({ kind: 'image', src: `${options.baseUrl}story-media/${encodeURIComponent(image)}`, ...(caption ? { caption } : {}) })
      } else {
        slides.push({ kind: 'text', caption })
      }
    }
    story = {
      id: `${date}:custom:${state?.publishedAt || 'draft'}`,
      source: 'custom',
      date,
      expiresAt: storyDayEnd(date),
      ...(publishedToday ? {} : { preview: true }),
      slides,
    }
    if (folder.ignored.length > 0) console.warn(`[story] ignored (only pictures and .md are used): ${folder.ignored.join(', ')}`)
  } else {
    story = articleStory(today, options.articles, options.plainText, options.isProduction)
    if (storyFolderHasContent(folder) && state !== null && state.date < today) {
      console.warn('[story] /story holds an old story that is no longer shown; `npm run cleanStory` deletes it (done automatically every day on GitHub).')
    }
  }

  await mkdir(path.dirname(generatedStoryFile), { recursive: true })
  await writeFile(generatedStoryFile, `${JSON.stringify(story, null, 2)}\n`, 'utf8')
  if (story) console.log(`Story: ${story.source} · ${story.slides.length} slide(s)${story.preview ? ' (draft preview)' : ''}`)
  return story
}
