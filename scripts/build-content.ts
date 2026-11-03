import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import matter from 'gray-matter'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { ArticleMeta, SearchEntry } from '../src/lib/types.ts'
import siteConfig from '../src/site.config.ts'
import { detectProvider, parseYouTubeId, youtubePoster } from '../src/lib/embed.ts'
import { markdownToPlainText } from '../src/lib/plainText.ts'
import { coverTypeFor, encodeMediaPath, isAbsoluteUrl, normalizeMediaPath, rewriteMediaUrl, prepareVideoForBrowser, type MediaFile } from './lib/media.ts'
import { allCollections, type Collection } from './lib/collections.ts'
import { buildStory } from './lib/story.ts'
import { isTestFolder, parseBlog, readDates, validateFolderName, type DatesRegistry } from './lib/blog.ts'

interface PreparedPage {
  number: number
  title?: string
  /** Markdown with media URLs already pointing at the published files. */
  body: string
}

interface PreparedArticle {
  meta: ArticleMeta
  body: string
  /** Books: the `pages/<number>.md` files, ascending. */
  pages: PreparedPage[]
  mediaFiles: MediaFile[]
  articleDirectory: string
  /** false when the article says `show: false` (hidden from the online site). */
  show: boolean
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedRoot = path.join(projectRoot, 'src', 'generated')
const mediaCacheRoot = path.join(projectRoot, '.cache', 'media')
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

/**
 * A page file lives in `pages/`, so `![](./fig.png)` there means `pages/fig.png` when that file exists and the book's
 * own folder otherwise (`../fig.png` and `fig.png` both reach the book folder).
 */
function pageMediaUrl(url: string, mediaFiles: MediaFile[]): string {
  if (isAbsoluteUrl(url)) return url
  const suffixAt = url.search(/[?#]/)
  const pathPart = suffixAt === -1 ? url : url.slice(0, suffixAt)
  const candidate = `pages/${normalizeMediaPath(pathPart)}`
  return mediaFiles.some((media) => media.relativePath === candidate) ? `${candidate}${suffixAt === -1 ? '' : url.slice(suffixAt)}` : url
}

function rewriteMarkdownMedia(body: string, slug: string, mediaFiles: MediaFile[], mediaDir: string, inPages = false): string {
  const locate = (url: string) => (inPages ? pageMediaUrl(url, mediaFiles) : url)
  const tree = unified().use(remarkParse).parse(body)
  const edits: { start: number; end: number; replacement: string }[] = []

  visit(tree, ['image', 'link', 'definition'], (node) => {
    if (!('url' in node) || typeof node.url !== 'string' || !node.position) return
    const { start, end } = node.position
    if (start.offset === undefined || end.offset === undefined) return

    const replacement = rewriteMediaUrl(locate(node.url), slug, mediaFiles, baseUrl, mediaDir)
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
    /\b(src|href|poster|image|link|cover)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _whole: string, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const original = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
      const next = rewriteMediaUrl(locate(original), slug, mediaFiles, baseUrl, mediaDir)
      if (next === original) return match
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : ''
      return `${attribute}=${quote}${next}${quote}`
    },
  )

  return rewritten.replace(
    /\b(srcset)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _whole: string, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const original = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
      const next = rewriteSrcset(original, slug, mediaFiles, baseUrl, mediaDir)
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
  mediaDir = 'content',
): string {
  function rewriteCandidate(candidate: string): string {
    const leading = candidate.match(/^\s*/)?.[0] ?? ''
    const trailing = candidate.match(/\s*$/)?.[0] ?? ''
    const trimmed = candidate.slice(leading.length, candidate.length - trailing.length)
    const separator = trimmed.search(/\s/)
    const url = separator === -1 ? trimmed : trimmed.slice(0, separator)
    const descriptor = separator === -1 ? '' : trimmed.slice(separator)
    return `${leading}${rewriteMediaUrl(url, slug, mediaFiles, base, mediaDir)}${descriptor}${trailing}`
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

/**
 * Book pages: `pages/1.md`, `pages/2.md` … The FILE NAME is the page number (so the address is /books/<book>/<number>,
 * pages can be added or skipped without renaming anything, and 10.md follows 9.md). Optional frontmatter: `title:`.
 */
async function readBookPages(articleDirectory: string, slug: string, mediaFiles: MediaFile[], collection: Collection): Promise<PreparedPage[]> {
  const pagesDirectory = path.join(articleDirectory, 'pages')
  let names: string[]
  try {
    names = (await readdir(pagesDirectory, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const pages: PreparedPage[] = []
  const seen = new Map<number, string>()
  for (const name of names.filter((file) => file.toLowerCase().endsWith('.md'))) {
    const filePath = path.join(pagesDirectory, name)
    const match = name.match(/^(\d+)\.md$/i)
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 999999) {
      console.warn(`! ${relativeFilePath(filePath)}: ignored. Page files are named by page number: 1.md, 2.md, 3.md …`)
      continue
    }
    const number = Number(match[1])
    const duplicate = seen.get(number)
    if (duplicate) fail(filePath, `page ${number} exists twice (${duplicate} and ${name}); keep one`)
    seen.set(number, name)

    let parsed: ReturnType<typeof matter>
    try {
      parsed = matter((await readFile(filePath, 'utf8')).replace(/^\uFEFF/, ''))
    } catch (error) {
      return fail(filePath, `invalid frontmatter (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    }
    const title = typeof parsed.data.title === 'string' && parsed.data.title.trim() ? parsed.data.title.trim() : undefined
    pages.push({ number, ...(title ? { title } : {}), body: rewriteMarkdownMedia(parsed.content.trim(), slug, mediaFiles, collection.mediaDir, true) })
  }
  return pages.sort((first, second) => first.number - second.number)
}

async function prepareArticle(articleDirectory: string, dates: DatesRegistry, collection: Collection): Promise<PreparedArticle> {
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

  const allFiles = await collectMediaFiles(articleDirectory)
  // `pages/<number>.md` are the book's pages, not media.
  const mediaFiles = allFiles.filter((media) => !/^pages\/\d+\.md$/i.test(media.relativePath))
  const pages = collection.id === 'books' ? await readBookPages(articleDirectory, slug, mediaFiles, collection) : []
  let coverFile: MediaFile | undefined
  /** `cover: https://…` : a picture hosted elsewhere (nothing to commit to Git). */
  let remoteCover: string | undefined

  if (blog.cover !== undefined && /^https:\/\//i.test(blog.cover)) {
    remoteCover = blog.cover
  } else if (blog.cover !== undefined) {
    const requestedCover = normalizeMediaPath(blog.cover)
    coverFile = mediaFiles.find((media) => media.relativePath === requestedCover && media.type !== null)
    if (!coverFile) {
      const problem = `cover file "${blog.cover}" was not found or has an unsupported media extension`
      // On your computer a typo should stop you; the online build must not fail over a decorative picture.
      if (!process.argv.includes('--production')) return fail(indexPath, problem)
      console.warn(`! ${relativeFilePath(indexPath)}: ${problem}; building without a cover. If the file exists on your computer, .gitignore may be excluding it (content/blog/*/*.jpg …) so it was never pushed to GitHub: remove that rule, or use an https image URL as the cover.`)
    }
  } else {
    // The cover is always a file called cover.<any image / video / audio extension>.
    coverFile = mediaFiles.find((media) =>
      media.type !== null && path.posix.basename(media.relativePath).toLowerCase().startsWith('cover.'),
    )
  }

  const body = rewriteMarkdownMedia(blog.body, slug, mediaFiles, collection.mediaDir)
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
          url: `${baseUrl}${collection.mediaDir}/${encodeURIComponent(slug)}/${encodeMediaPath(coverFile.relativePath)}`,
          type: coverFile.type,
        }
      : remoteCover
        ? { url: remoteCover, type: 'image' }
        : blog.coverEmbed
          ? embedCover(blog.coverEmbed)
          : null,
    readingTime: blog.readingTime ?? Math.max(1, Math.ceil(words / 200)),
    ...(blog.lang ? { lang: blog.lang } : {}),
    ...(blog.dir ? { dir: blog.dir } : {}),
    ...(blog.adult === true ? { adult: true } : {}),
    // Only `publishBlog` marks an article as published (old, new, test and unregistered articles alike).
    // Test folders (`_…`) are fixtures: they never carry the «not finished yet» notice.
    ...(registered?.published === true || isTestFolder(slug) ? {} : { incomplete: true }),
    ...(pages.length > 0 ? { pages: pages.map((page) => ({ number: page.number, ...(page.title ? { title: page.title } : {}) })) } : {}),
  }

  return { meta, body, pages, mediaFiles, articleDirectory, show: blog.show !== false }
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** sitemap.xml, robots.txt, rss.xml and _headers (CSP frame-src). Needs `siteUrl` in src/site.config.ts. */
async function writeSiteFiles(metadata: ArticleMeta[], bookMetadata: ArticleMeta[]): Promise<void> {
  const publicRoot = path.join(projectRoot, 'public')
  const base = (typeof siteConfig.siteUrl === 'string' ? siteConfig.siteUrl : '').replace(/\/+$/, '')
  if (!base) throw new Error('src/site.config.ts: siteUrl must be a non-empty URL string.')
  if (/example\.com/.test(base)) {
    console.warn('! siteUrl in src/site.config.ts is still "example.com": set it before deploying (sitemap, RSS and canonical URLs use it).')
  }

  const urls = [
    { loc: `${base}/`, lastmod: metadata[0]?.updated },
    ...metadata.map((article) => ({ loc: `${base}/blog/${article.slug}`, lastmod: article.updated })),
    { loc: `${base}/books`, lastmod: bookMetadata[0]?.updated },
    ...bookMetadata.flatMap((book) => [
      { loc: `${base}/books/${book.slug}`, lastmod: book.updated },
      ...(book.pages ?? []).map((page) => ({ loc: `${base}/books/${book.slug}/${page.number}`, lastmod: book.updated })),
    ]),
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

interface BuiltCollection {
  collection: Collection
  metadata: ArticleMeta[]
  articles: PreparedArticle[]
}

/** Builds one collection (blog or books): validates it, copies its media and writes its generated files. */
async function buildCollection(collection: Collection, isProduction: boolean): Promise<BuiltCollection> {
  let entries: Dirent[]
  try {
    entries = await readdir(collection.root, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') entries = []
    else throw error
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !isProduction || !entry.name.startsWith('_'))
    .sort((left, right) => left.name.localeCompare(right.name))
  const articles: PreparedArticle[] = []
  // Items with `show: false`: left out of the online build completely (no page text, no media, no search,
  // no sitemap); only their address is kept so the site can answer «the admin does not allow this page».
  const hiddenSlugs: string[] = []
  const dates = await readDates(collection.datesFile)
  const seenSlugs = new Map<string, string>()

  for (const directory of directories) {
    const articleDirectory = path.join(collection.root, directory.name)
    const indexPath = path.join(articleDirectory, 'index.md')
    try {
      await stat(indexPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw error
    }

    const article = await prepareArticle(articleDirectory, dates, collection)

    const duplicatePath = seenSlugs.get(article.meta.slug)
    if (duplicatePath) {
      fail(indexPath, `duplicate slug "${article.meta.slug}"; already used by ${relativeFilePath(duplicatePath)}`)
    }
    seenSlugs.set(article.meta.slug, indexPath)
    if (isProduction && !article.show) {
      hiddenSlugs.push(article.meta.slug)
      continue
    }
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

  // Book pages are found only by the «محتوا::» search (one entry per page, address `<book>/<page>`).
  for (const article of articles) {
    for (const page of article.pages) {
      searchIndex.push({
        slug: `${article.meta.slug}/${page.number}`,
        title: `${article.meta.title}، صفحه ${page.number}`,
        phrases: [],
        content: plainText(page.body).replace(/\|/g, ' '),
        contentOnly: true,
      })
    }
  }

  const publicRoot = path.join(projectRoot, 'public', collection.mediaDir)
  await rm(publicRoot, { recursive: true, force: true })
  await mkdir(publicRoot, { recursive: true })
  const bodiesDirectory = path.join(generatedRoot, collection.files.bodiesDir)
  await rm(bodiesDirectory, { recursive: true, force: true })
  await mkdir(bodiesDirectory, { recursive: true })
  await mkdir(generatedRoot, { recursive: true })

  for (const article of articles) {
    const destinationRoot = path.join(publicRoot, article.meta.slug)
    for (const media of article.mediaFiles) {
      const destination = path.join(destinationRoot, ...media.relativePath.split('/'))
      await mkdir(path.dirname(destination), { recursive: true })
      if (media.type === 'video') {
        const prepared = await prepareVideoForBrowser(media.sourcePath, mediaCacheRoot)
        await copyFile(prepared.filePath, destination)
        if (prepared.message) console.warn(`[media] ${article.meta.slug}/${media.relativePath}: ${prepared.message}`)
      } else {
        await copyFile(media.sourcePath, destination)
      }
    }

    await writeFile(path.join(bodiesDirectory, `${article.meta.slug}.md`), article.body, 'utf8')

    // Pages are published as plain files and fetched when opened (thousands of pages must not become thousands of
    // bundle chunks).
    if (article.pages.length > 0) {
      const pagesFolder = path.join(destinationRoot, 'pages')
      await mkdir(pagesFolder, { recursive: true })
      for (const page of article.pages) await writeFile(path.join(pagesFolder, `${page.number}.md`), page.body, 'utf8')
    }
  }

  const bodyImports = articles
    .map(({ meta }) => `  ${JSON.stringify(meta.slug)}: () => import('./${collection.files.bodiesDir}/${meta.slug}.md?raw'),`)
    .join('\n')
  const bodyModule = [
    `export const ${collection.files.bodiesExport}: Record<string, () => Promise<{ default: string }>> = {`,
    bodyImports,
    '}',
    '',
  ].join('\n')

  await writeFile(path.join(generatedRoot, collection.files.meta), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  await writeFile(path.join(generatedRoot, collection.files.search), `${JSON.stringify(searchIndex, null, 2)}\n`, 'utf8')
  await writeFile(path.join(generatedRoot, collection.files.bodiesModule), bodyModule, 'utf8')
  await writeFile(path.join(generatedRoot, collection.files.hidden), `${JSON.stringify(hiddenSlugs.sort(), null, 2)}\n`, 'utf8')
  if (hiddenSlugs.length > 0) console.log(`Hidden online (${collection.id}, show: false): ${hiddenSlugs.join(', ')}`)

  console.log(`\n[${collection.id}]`)
  console.table(metadata.map((article) => ({
    slug: article.slug,
    title: article.title,
    date: article.date,
    updated: article.updated,
    cover: article.cover?.type ?? 'none',
    suggestions: article.suggestions.length,
    pages: article.pages?.length ?? 0,
  })))

  return { collection, metadata, articles }
}

async function buildContent(): Promise<void> {
  const isProduction = process.argv.includes('--production')
  const built: BuiltCollection[] = []
  for (const collection of allCollections) built.push(await buildCollection(collection, isProduction))
  const blog = built.find((item) => item.collection.id === 'blog') as BuiltCollection
  const books = built.find((item) => item.collection.id === 'books') as BuiltCollection

  await buildStory({
    isProduction,
    baseUrl,
    articles: blog.metadata.flatMap((meta) => {
      const prepared = blog.articles.find((article) => article.meta.slug === meta.slug)
      return prepared ? [{ meta, body: prepared.body }] : []
    }),
    plainText,
  })

  await writeSiteFiles(blog.metadata, books.metadata)
}

buildContent().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})