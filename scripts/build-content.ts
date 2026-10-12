import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { ArticleMeta, SearchEntry } from '../src/lib/types.ts'
import siteConfig from '../src/site.config.ts'
import { detectProvider, parseYouTubeId, youtubePoster } from '../src/lib/embed.ts'
import { coverTypeFor, encodeMediaPath, normalizeMediaPath, rewriteMediaUrl, type MediaFile } from './lib/media.ts'
import { slugify } from './lib/slug.ts'
import { validateCoverEmbed, validateDir, validateLang, validateStyle } from './lib/validators.ts'

interface PreparedArticle {
  meta: ArticleMeta
  body: string
  mediaFiles: MediaFile[]
  articleDirectory: string
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogRoot = path.join(projectRoot, 'content', 'blog')
const publicContentRoot = path.join(projectRoot, 'public', 'content')
const generatedRoot = path.join(projectRoot, 'src', 'generated')
function relativeFilePath(filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join('/')
}

function fail(filePath: string, message: string): never {
  throw new Error(`${relativeFilePath(filePath)}: ${message}`)
}

function readStringArray(
  data: Record<string, unknown>,
  field: 'tags' | 'suggestions',
  filePath: string,
): string[] {
  const value = data[field]
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return fail(filePath, `"${field}" must be an array of strings`)
  }
  return value.map((item) => item.trim()).filter(Boolean)
}

function readOptionalDate(
  value: unknown,
  field: 'date' | 'updated',
  filePath: string,
): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return fail(filePath, `"${field}" must be a valid date`)
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fail(filePath, `"${field}" must be a valid date`)
  return date.toISOString().slice(0, 10)
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/:{3,}[\w-]*/g, ' ')
    .replace(/[>*_~`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerptFrom(markdown: string): string {
  return Array.from(plainText(markdown)).slice(0, 160).join('')
}

function rewriteMarkdownMedia(body: string, slug: string, mediaFiles: MediaFile[]): string {
  const tree = unified().use(remarkParse).parse(body)
  const edits: { start: number; end: number; replacement: string }[] = []

  visit(tree, ['image', 'link', 'definition'], (node) => {
    if (!('url' in node) || typeof node.url !== 'string' || !node.position) return
    const { start, end } = node.position
    if (start.offset === undefined || end.offset === undefined) return

    const replacement = rewriteMediaUrl(node.url, slug, mediaFiles)
    if (replacement === node.url) return

    const rawNode = body.slice(start.offset, end.offset)
    const urlOffset = rawNode.lastIndexOf(node.url)
    if (urlOffset === -1) return

    edits.push({
      start: start.offset + urlOffset,
      end: start.offset + urlOffset + node.url.length,
      replacement,
    })
  })

  let rewritten = body
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    rewritten = `${rewritten.slice(0, edit.start)}${edit.replacement}${rewritten.slice(edit.end)}`
  }

  rewritten = rewritten.replace(
    /\b(src|href|poster|image)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _whole: string, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const original = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
      const next = rewriteMediaUrl(original, slug, mediaFiles)
      if (next === original) return match
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : ''
      return `${attribute}=${quote}${next}${quote}`
    },
  )

  return rewritten.replace(
    /\b(srcset)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _whole: string, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const original = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
      const next = rewriteSrcset(original, slug, mediaFiles)
      if (next === original) return match
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : ''
      return `${attribute}=${quote}${next}${quote}`
    },
  )
}

function rewriteSrcset(value: string, slug: string, mediaFiles: MediaFile[]): string {
  function rewriteCandidate(candidate: string): string {
    const leading = candidate.match(/^\s*/)?.[0] ?? ''
    const trailing = candidate.match(/\s*$/)?.[0] ?? ''
    const trimmed = candidate.slice(leading.length, candidate.length - trailing.length)
    const separator = trimmed.search(/\s/)
    const url = separator === -1 ? trimmed : trimmed.slice(0, separator)
    const descriptor = separator === -1 ? '' : trimmed.slice(separator)
    return `${leading}${rewriteMediaUrl(url, slug, mediaFiles)}${descriptor}${trailing}`
  }

  let result = ''
  let candidateStart = 0
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== ',') continue
    const candidate = value.slice(candidateStart, index)
    const trimmed = candidate.trim()
    const url = trimmed.split(/\s+/, 1)[0]
    const isUnspacedAbsoluteUrl =
      !/\s/.test(trimmed) && /^[a-z][a-z\d+.-]*:/i.test(url)
    if (isUnspacedAbsoluteUrl) continue

    result += `${rewriteCandidate(candidate)},`
    candidateStart = index + 1
  }

  return result + rewriteCandidate(value.slice(candidateStart))
}

async function collectMediaFiles(directory: string): Promise<MediaFile[]> {
  const collected: MediaFile[] = []

  async function walk(currentDirectory: string): Promise<void> {
    const entries = await readdir(currentDirectory, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }

      if (!entry.isFile() || (currentDirectory === directory && entry.name.toLowerCase() === 'index.md')) continue
      const type = coverTypeFor(entryPath)
      collected.push({
        sourcePath: entryPath,
        relativePath: path.relative(directory, entryPath).split(path.sep).join('/'),
        type,
      })
    }
  }

  await walk(directory)
  return collected.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

function embedCover(url: string): NonNullable<ArticleMeta['cover']> {
  const provider = detectProvider(url)
  const youtubeId = provider === 'youtube' ? parseYouTubeId(url) : null
  return {
    url,
    type: 'embed',
    embedProvider: provider,
    ...(youtubeId ? { poster: youtubePoster(youtubeId) } : {}),
  }
}

async function prepareArticle(articleDirectory: string): Promise<PreparedArticle> {
  const indexPath = path.join(articleDirectory, 'index.md')
  const source = await readFile(indexPath, 'utf8')
  const parsed = matter(source)
  const data = parsed.data as Record<string, unknown>

  if (typeof data.title !== 'string' || !data.title.trim()) {
    return fail(indexPath, '"title" is required and must be a non-empty string')
  }

  const name = data.name
  if (name !== undefined && typeof name !== 'string') {
    return fail(indexPath, '"name" must be a string')
  }
  const folderName = path.basename(articleDirectory)
  const slug = slugify(typeof name === 'string' ? name : folderName)
  if (!slug || !/^[a-z0-9_-]+$/.test(slug)) {
    return fail(indexPath, 'slug must contain only lowercase letters, numbers, hyphens, and underscores')
  }

  const suggestions = readStringArray(data, 'suggestions', indexPath)
  const tags = readStringArray(data, 'tags', indexPath)
  const relativeIndex = relativeFilePath(indexPath)
  const style = validateStyle(data.style, relativeIndex)
  const coverEmbed = validateCoverEmbed(data.coverEmbed, relativeIndex)
  const lang = validateLang(data.lang, relativeIndex)
  const dir = validateDir(data.dir, relativeIndex)
  if (data.description !== undefined && typeof data.description !== 'string') {
    return fail(indexPath, '"description" must be a string')
  }
  if (data.cover !== undefined && typeof data.cover !== 'string') {
    return fail(indexPath, '"cover" must be a relative media path string')
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    return fail(indexPath, '"draft" must be a boolean')
  }

  const date = readOptionalDate(data.date, 'date', indexPath) ?? (await stat(indexPath)).mtime.toISOString().slice(0, 10)
  const updated = readOptionalDate(data.updated, 'updated', indexPath)
  const mediaFiles = await collectMediaFiles(articleDirectory)
  let coverFile: MediaFile | undefined

  if (typeof data.cover === 'string') {
    const requestedCover = normalizeMediaPath(data.cover)
    coverFile = mediaFiles.find((media) => media.relativePath === requestedCover && media.type !== null)
    if (!coverFile) return fail(indexPath, `cover file "${data.cover}" was not found or has an unsupported media extension`)
  } else {
    coverFile = mediaFiles.find((media) =>
      media.type !== null && path.posix.basename(media.relativePath).toLowerCase().startsWith('cover.'),
    )
  }

  const body = rewriteMarkdownMedia(parsed.content, slug, mediaFiles)
  const words = parsed.content.trim().split(/\s+/).filter(Boolean).length
  const explicitDescription = typeof data.description === 'string' ? data.description.trim() : ''
  const meta: ArticleMeta = {
    slug,
    title: data.title.trim(),
    description: explicitDescription || excerptFrom(parsed.content),
    date,
    updated,
    tags,
    suggestions,
    cover: coverFile?.type
      ? { url: `/content/${slug}/${encodeMediaPath(coverFile.relativePath)}`, type: coverFile.type }
      : coverEmbed ? embedCover(coverEmbed) : null,
    style,
    readingTime: Math.max(1, Math.ceil(words / 200)),
    ...(lang ? { lang } : {}),
    ...(dir ? { dir } : {}),
  }

  return { meta, body, mediaFiles, articleDirectory }
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** sitemap.xml, robots.txt, rss.xml and _headers (CSP frame-src). Needs `siteUrl` in src/site.config.ts. */
async function writeSiteFiles(metadata: ArticleMeta[]): Promise<void> {
  const publicRoot = path.join(projectRoot, 'public')
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  if (/example\.com/.test(base)) {
    console.warn('! siteUrl in src/site.config.ts is still "example.com": set it before deploying (sitemap, RSS and canonical URLs use it).')
  }

  const urls = [
    { loc: `${base}/`, lastmod: metadata[0]?.updated ?? metadata[0]?.date },
    ...metadata.map((article) => ({ loc: `${base}/blog/${article.slug}`, lastmod: article.updated ?? article.date })),
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${xmlEscape(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}</url>`),
    '</urlset>',
    '',
  ].join('\n')

  const items = metadata.slice(0, 50).map((article) => [
    '    <item>',
    `      <title>${xmlEscape(article.title)}</title>`,
    `      <link>${xmlEscape(`${base}/blog/${article.slug}`)}</link>`,
    `      <guid isPermaLink="true">${xmlEscape(`${base}/blog/${article.slug}`)}</guid>`,
    `      <pubDate>${new Date(`${article.date}T12:00:00Z`).toUTCString()}</pubDate>`,
    `      <description>${xmlEscape(article.description)}</description>`,
    '    </item>',
  ].join('\n'))
  const rss = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${xmlEscape(siteConfig.siteName)}</title>`,
    `    <link>${xmlEscape(base)}</link>`,
    `    <description>${xmlEscape(siteConfig.siteDescription)}</description>`,
    '    <language>fa</language>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`

  const frameHosts = siteConfig.embedAllowlist
    .flatMap((host) => [`https://${host}`, `https://*.${host}`])
    .join(' ')
  const headers = [
    '# Generated by scripts/build-content.ts from src/site.config.ts → embedAllowlist. Do not edit by hand.',
    '/*',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Content-Type-Options: nosniff',
    `  Content-Security-Policy: frame-src 'self' ${frameHosts}`,
    '',
  ].join('\n')

  await mkdir(publicRoot, { recursive: true })
  await Promise.all([
    writeFile(path.join(publicRoot, 'sitemap.xml'), sitemap, 'utf8'),
    writeFile(path.join(publicRoot, 'rss.xml'), rss, 'utf8'),
    writeFile(path.join(publicRoot, 'robots.txt'), robots, 'utf8'),
    writeFile(path.join(publicRoot, '_headers'), headers, 'utf8'),
  ])
}

async function buildContent(): Promise<void> {
  const isProduction = process.argv.includes('--production')
  let entries: Dirent[]
  try {
    entries = await readdir(blogRoot, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') entries = []
    else throw error
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !isProduction || !entry.name.startsWith('_'))
    .sort((left, right) => left.name.localeCompare(right.name))
  const articles: PreparedArticle[] = []
  const seenSlugs = new Map<string, string>()

  for (const directory of directories) {
    const articleDirectory = path.join(blogRoot, directory.name)
    const indexPath = path.join(articleDirectory, 'index.md')
    try {
      await stat(indexPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw error
    }

    const article = await prepareArticle(articleDirectory)
    if (isProduction && matter(await readFile(indexPath, 'utf8')).data.draft === true) continue

    const duplicatePath = seenSlugs.get(article.meta.slug)
    if (duplicatePath) {
      fail(indexPath, `duplicate slug "${article.meta.slug}"; already used by ${relativeFilePath(duplicatePath)}`)
    }
    seenSlugs.set(article.meta.slug, indexPath)
    articles.push(article)
  }

  const metadata = articles
    .map((article) => article.meta)
    .sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug))
  const searchIndex: SearchEntry[] = metadata.map((article) => ({
    slug: article.slug,
    title: article.title,
    phrases: [article.title, ...article.suggestions, ...article.tags],
  }))

  await rm(publicContentRoot, { recursive: true, force: true })
  await mkdir(publicContentRoot, { recursive: true })
  const bodiesDirectory = path.join(generatedRoot, 'bodies')
  await rm(bodiesDirectory, { recursive: true, force: true })
  await mkdir(bodiesDirectory, { recursive: true })
  await mkdir(generatedRoot, { recursive: true })

  for (const article of articles) {
    const destinationRoot = path.join(publicContentRoot, article.meta.slug)
    for (const media of article.mediaFiles) {
      const destination = path.join(destinationRoot, ...media.relativePath.split('/'))
      await mkdir(path.dirname(destination), { recursive: true })
      await copyFile(media.sourcePath, destination)
    }

    await writeFile(path.join(bodiesDirectory, `${article.meta.slug}.md`), article.body, 'utf8')
  }

  const bodyImports = articles
    .map(({ meta }) => `  ${JSON.stringify(meta.slug)}: () => import('./bodies/${meta.slug}.md?raw'),`)
    .join('\n')
  const bodyModule = [
    'export const articleBodies: Record<string, () => Promise<{ default: string }>> = {',
    bodyImports,
    '}',
    '',
  ].join('\n')

  await writeFile(path.join(generatedRoot, 'articles.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  await writeFile(path.join(generatedRoot, 'search-index.json'), `${JSON.stringify(searchIndex, null, 2)}\n`, 'utf8')
  await writeFile(path.join(generatedRoot, 'bodies.ts'), bodyModule, 'utf8')

  console.table(metadata.map((article) => ({
    slug: article.slug,
    title: article.title,
    style: article.style,
    cover: article.cover?.type ?? 'none',
    suggestions: article.suggestions.length,
  })))

  await writeSiteFiles(metadata)
}

buildContent().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})