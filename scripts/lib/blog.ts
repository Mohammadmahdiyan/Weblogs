/*
  Shared helpers for the blog commands (publishBlog, deleteBlog, createTest, deleteTest) and for scripts/build-content.ts. Everything that decides what a valid article
  looks like lives here so the commands and the build can never disagree.

  The markdown file contains ONLY:

      ---
      tags: [tag one, tag two]        # optional
      suggestions:                    # optional (default: the title)
        - a phrase people search for
      ---
      # Title                         # the first "# " line is the title

  Dates are not written in the markdown: they live in content/blog-dates.json, which the
  commands and development watcher maintain (date = creation day, updated = last saved change after publication).
*/
import { spawnSync } from 'node:child_process'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { validateCoverEmbed, validateDir, validateLang } from './validators.ts'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const blogRoot = path.join(projectRoot, 'content', 'blog')
export const datesFile = path.join(projectRoot, 'content', 'blog-dates.json')

/** Folders that start with `_` are test blogs: shown in development only, never built for production. */
export function isTestFolder(name: string): boolean {
  return name.startsWith('_')
}

/** The folder name is the URL: lowercase letters, digits, `-` and `_` only. */
export function validateFolderName(name: string): string {
  if (!/^_?[a-z0-9][a-z0-9_-]*$/.test(name)) {
    throw new Error(
      `folder name "${name}" is not URL-safe: use only lowercase a-z, 0-9, "-" and "_" (the folder name becomes /blog/<name>). Rename the folder and try again.`,
    )
  }
  return name
}

export async function exists(target: string): Promise<boolean> {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

/** Today as YYYY-MM-DD in the local time zone. */
export function today(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// ───────────────────────── dates registry ─────────────────────────

export interface BlogDates {
  date: string
  updated: string
  /** Whether the author has explicitly finished the article. Legacy entries count as complete. */
  completed: boolean
  /**
   * true only after `npm run publishBlog -- <folder>`. Every article without it (new or old) ends with the
   * «not finished yet» notice. Entries written before this flag existed count as NOT published.
   */
  published: boolean
}
export type DatesRegistry = Record<string, BlogDates>

const isoDate = /^\d{4}-\d{2}-\d{2}$/

export async function readDates(): Promise<DatesRegistry> {
  let raw: string
  try {
    raw = await readFile(datesFile, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error('content/blog-dates.json is not valid JSON. It is maintained by the blog commands; fix or delete it.', { cause: error })
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('content/blog-dates.json must be an object of { "<folder>": { "date", "updated" } }')
  }

  const registry: DatesRegistry = {}
  for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
    const entry = value as Partial<BlogDates> | null
    if (!entry || typeof entry.date !== 'string' || !isoDate.test(entry.date)) {
      throw new Error(`content/blog-dates.json: "${slug}" needs "date": "YYYY-MM-DD"`)
    }
    const updated = typeof entry.updated === 'string' && isoDate.test(entry.updated) ? entry.updated : entry.date
    registry[slug] = {
      date: entry.date,
      updated,
      // Existing registry entries predate this flag and should keep their current behavior.
      completed: typeof entry.completed === 'boolean' ? entry.completed : true,
      published: entry.published === true,
    }
  }
  return registry
}

export async function writeDates(registry: DatesRegistry): Promise<void> {
  const sorted = Object.fromEntries(Object.entries(registry).sort(([left], [right]) => left.localeCompare(right)))
  await writeFile(datesFile, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

// ───────────────────────── markdown parsing ─────────────────────────

/** Removes the simplest inline markdown so a heading becomes a clean plain-text title. */
function plainTitle(value: string): string {
  return value
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__|\*|~~)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Finds the first `# Heading` (outside code fences). That line is the blog name/title, and it is
 * removed from the body because the page already renders the title as its <h1>.
 */
export function splitTitle(markdown: string): { title: string; body: string } | null {
  const lines = markdown.split(/\r?\n/)
  let fence: string | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fence === null) fence = marker
      else if (fence === marker) fence = null
      continue
    }
    if (fence !== null) continue

    const heading = line.match(/^#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/)
    if (!heading) continue
    const title = plainTitle(heading[1])
    if (!title) continue

    const rest = [...lines.slice(0, index), ...lines.slice(index + 1)]
    if (rest[index]?.trim() === '') rest.splice(index, 1)
    return { title, body: rest.join('\n').replace(/^\s*\n/, '') }
  }
  return null
}

function stringList(data: Record<string, unknown>, key: 'tags' | 'suggestions', label: string): string[] {
  const value = data[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label}: "${key}" must be a list of strings`)
  }
  return [...new Set(value.map((item: string) => item.trim()).filter(Boolean))]
}

export interface ParsedBlog {
  title: string
  /** Markdown without the title line. */
  body: string
  tags: string[]
  suggestions: string[]
  description?: string
  readingTime?: number
  cover?: string
  coverEmbed?: string
  lang?: string
  dir?: 'ltr' | 'rtl'
  /** Whether the article requires an 18+ confirmation gate. */
  adult?: boolean
  /** Frontmatter keys that this engine no longer reads (e.g. `draft`, `style`, `title`, `date`). */
  ignoredKeys: string[]
}

const knownKeys = new Set(['tags', 'suggestions', 'description', 'readingTime', 'cover', 'coverEmbed', 'lang', 'dir', 'adult'])

/** Parses and validates one article file. Throws an Error whose message starts with `label`. */
export function parseBlog(source: string, label: string): ParsedBlog {
  let parsed: ReturnType<typeof matter>
  try {
    parsed = matter(source)
  } catch (error) {
    throw new Error(`${label}: invalid frontmatter (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`, { cause: error })
  }
  const data = parsed.data as Record<string, unknown>

  const split = splitTitle(parsed.content)
  if (!split) {
    throw new Error(`${label}: no title found. The first line that starts with "# " is the blog name, e.g. "# عنوان مقاله".`)
  }

  const tags = stringList(data, 'tags', label)
  const suggestions = stringList(data, 'suggestions', label)

  if (data.description !== undefined && typeof data.description !== 'string') {
    throw new Error(`${label}: "description" must be a string`)
  }
  if (data.adult !== undefined && typeof data.adult !== 'boolean') {
    throw new Error(`${label}: "adult" must be true or false`)
  }
  if (data.cover !== undefined && typeof data.cover !== 'string') {
    throw new Error(`${label}: "cover" must be a relative media path string`)
  }
  if (
    data.readingTime !== undefined &&
    (typeof data.readingTime !== 'number' || !Number.isInteger(data.readingTime) || data.readingTime < 1)
  ) {
    throw new Error(`${label}: "readingTime" must be a whole number of minutes (1 or more)`)
  }

  return {
    title: split.title,
    body: split.body,
    tags,
    suggestions: suggestions.length > 0 ? suggestions : [split.title],
    ...(typeof data.description === 'string' && data.description.trim() ? { description: data.description.trim() } : {}),
    ...(typeof data.readingTime === 'number' ? { readingTime: data.readingTime } : {}),
    ...(typeof data.cover === 'string' ? { cover: data.cover } : {}),
    ...optional('coverEmbed', validateCoverEmbed(data.coverEmbed, label)),
    ...optional('lang', validateLang(data.lang, label)),
    ...optional('dir', validateDir(data.dir, label)),
    ...(data.adult === true ? { adult: true } : {}),
    ignoredKeys: Object.keys(data).filter((key) => !knownKeys.has(key)),
  }
}

function optional<Key extends string, Value>(key: Key, value: Value | undefined): { [K in Key]?: Value } {
  return (value === undefined ? {} : { [key]: value }) as { [K in Key]?: Value }
}

// ───────────────────────── running the content step ─────────────────────────

/** Runs `npm run content`: validates the whole site and regenerates every generated file. */
export function runContentBuild(): boolean {
  console.log('→ npm run content (validating and regenerating site data)…')
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'content'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}
