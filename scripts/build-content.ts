import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { ArticleMeta, SearchEntry } from '../src/lib/types.ts'
import siteConfig from '../src/site.config.ts'
import { detectProvider, parseYouTubeId, youtubePoster } from '../src/lib/embed.ts'
import { markdownToPlainText } from '../src/lib/plainText.ts'
import { coverTypeFor, encodeMediaPath, normalizeMediaPath, rewriteMediaUrl, type MediaFile } from './lib/media.ts'
import { isTestFolder, parseBlog, readDates, validateFolderName, type DatesRegistry } from './lib/blog.ts'

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
const baseUrl = '/Weblogs/'
function relativeFilePath(filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join('/')
}

function fail(filePath: string, message: string): never {
  throw new Error(`${relativeFilePath(filePath)}: ${message}`)
}

function plainText(markdown: string | undefined): string {
  return markdownToPlainText(markdown)
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

    const replacement = rewriteMediaUrl(node.url, slug, mediaFiles, baseUrl)
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
      const next = rewriteMediaUrl(original, slug, mediaFiles, baseUrl)
      if (next === original) return match
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : ''
      return `${attribute}=${quote}${next}${quote}`
    },
  )

  return rewritten.replace(
    /\b(srcset)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _whole: string, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const original = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
      const next = rewriteSrcset(original, slug, mediaFiles, baseUrl)
      if (next === original) return match
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : ''
      return `${attribute}=${quote}${next}${quote}`
    },
  )
}

function rewriteSrcset(
  value: string,
  slug: string,
  mediaFiles: MediaFile[],
  base = '/',
): string {
  function rewriteCandidate(candidate: string): string {
    const leading = candidate.match(/^\s*/)?.[0] ?? ''
    const trailing = candidate.match(/\s*$/)?.[0] ?? ''
    const trimmed = candidate.slice(leading.length, candidate.length - trailing.length)
    const separator = trimmed.search(/\s/)
    const url = separator === -1 ? trimmed : trimmed.slice(0, separator)
    const descriptor = separator === -1 ? '' : trimmed.slice(separator)
    return `${leading}${rewriteMediaUrl(url, slug, mediaFiles, base)}${descriptor}${trailing}`
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

async function prepareArticle(articleDirectory: string, dates: DatesRegistry): Promise<PreparedArticle> {
  const indexPath = path.join(articleDirectory, 'index.md')
  const label = relativeFilePath(indexPath)
  const folderName = path.basename(articleDirectory)

  // The folder name is the slug (the URL).
  try {
    validateFolderName(folderName)
  } catch (error) {
    return fail(indexPath, error instanceof Error ? error.message : String(error))
  }
  const slug = folderName
  const blog = parseBlog(await readFile(indexPath, 'utf8'), label)
  if (blog.ignoredKeys.length > 0) {
    console.warn(
      `! ${label}: ignored frontmatter key(s) ${blog.ignoredKeys.map((key) => `"${key}"`).join(', ')}. ` +
        'The title is the first "# " line, dates are managed by the blog commands.',
    )
  }

  // date / updated come from content/blog-dates.json (maintained by the dev watcher and publishBlog).
  const registered = dates[slug]
  const fileDay = (await stat(indexPath)).mtime.toISOString().slice(0, 10)
  if (!registered && !isTestFolder(slug)) {
    console.warn(`! ${label}: no creation date registered; using the file date. Run "npm run dev" to register it automatically.`)
  }
  const date = registered?.date ?? fileDay
  const updated = registered?.completed === false ? date : (registered?.updated ?? date)

  const mediaFiles = await collectMediaFiles(articleDirectory)
  let coverFile: MediaFile | undefined

  if (blog.cover !== undefined) {
    const requestedCover = normalizeMediaPath(blog.cover)
    coverFile = mediaFiles.find((media) => media.relativePath === requestedCover && media.type !== null)
    if (!coverFile) return fail(indexPath, `cover file "${blog.cover}" was not found or has an unsupported media extension`)
  } else {
    // The cover is always a file called cover.<any image / video / audio extension>.
    coverFile = mediaFiles.find((media) =>
      media.type !== null && path.posix.basename(media.relativePath).toLowerCase().startsWith('cover.'),
    )
  }

  const body = rewriteMarkdownMedia(blog.body, slug, mediaFiles)
  const words = blog.body.trim().split(/\s+/).filter(Boolean).length
  const meta: ArticleMeta = {
    slug,
    title: blog.title,
    description: blog.description ?? excerptFrom(blog.body),
    date,
    updated,
    tags: blog.tags,
    suggestions: blog.suggestions,
    cover: coverFile?.type
      ? {
          url: `${baseUrl}content/${encodeURIComponent(slug)}/${encodeMediaPath(coverFile.relativePath)}`,
          type: coverFile.type,
        }
      : blog.coverEmbed
        ? embedCover(blog.coverEmbed)
        : null,
    readingTime: blog.readingTime ?? Math.max(1, Math.ceil(words / 200)),
    ...(blog.lang ? { lang: blog.lang } : {}),
    ...(blog.dir ? { dir: blog.dir } : {}),
    ...(blog.adult === true ? { adult: true } : {}),
    // Only `publishBlog` marks an article as published (old, new, test and unregistered articles alike).
    ...(registered?.published === true ? {} : { incomplete: true }),
  }

  return { meta, body, mediaFiles, articleDirectory }
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** sitemap.xml, robots.txt, rss.xml and _headers (CSP frame-src). Needs `siteUrl` in src/site.config.ts. */
async function writeSiteFiles(metadata: ArticleMeta[]): Promise<void> {
  const publicRoot = path.join(projectRoot, 'public')
  const base = (typeof siteConfig.siteUrl === 'string' ? siteConfig.siteUrl : '').replace(/\/+$/, '')
  if (!base) throw new Error('src/site.config.ts: siteUrl must be a non-empty URL string.')
  if (/example\.com/.test(base)) {
    console.warn('! siteUrl in src/site.config.ts is still "example.com": set it before deploying (sitemap, RSS and canonical URLs use it).')
  }

  const urls = [
    { loc: `${base}/`, lastmod: metadata[0]?.updated },
    ...metadata.map((article) => ({ loc: `${base}/blog/${article.slug}`, lastmod: article.updated })),
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
  const dates = await readDates()
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

    const article = await prepareArticle(articleDirectory, dates)

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
  // Search metadata is sorted separately from PreparedArticle, so resolve the
  // original Markdown body by slug instead of reading a nonexistent meta.body.
  const preparedBySlug = new Map(articles.map((article) => [article.meta.slug, article]))
  const searchIndex: SearchEntry[] = metadata.map((article) => {
    const prepared = preparedBySlug.get(article.slug)
    return {
      slug: article.slug,
      title: article.title,
      phrases: [...new Set([article.title, ...article.suggestions, ...article.tags])],
      content: plainText([article.title, prepared?.body].filter(Boolean).join('\n')).replace(/\|/g, ' '),
    }
  })

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
    date: article.date,
    updated: article.updated,
    cover: article.cover?.type ?? 'none',
    suggestions: article.suggestions.length,
  })))

  await writeSiteFiles(metadata)
}

buildContent().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})