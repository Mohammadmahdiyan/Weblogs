import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import GithubSlugger from 'github-slugger'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import { parseBlog, projectRoot, validateAliasUniqueness } from './blog.ts'
import { collections, type CollectionId } from './collections.ts'
import { markClosingHeadings, removeClosingHeadings } from '../../src/lib/closingHeadings.ts'
import { parseVideoHash } from '../../src/lib/videoLink.ts'

export interface ArticleRoute {
  collection: CollectionId
  slug: string
  directory: string
  aliases: string[]
  pages: Set<string>
  /** Books: the total number of pages the author has announced (`pageCount:` frontmatter). */
  pageCount?: number
  headings: Map<string, Set<string>>
}

export interface RouteTable {
  articles: ArticleRoute[]
  directories: Set<string>
}

export interface ContentLink {
  file: string
  line: number
  href: string
  start: number
  end: number
}

export interface BrokenLink extends ContentLink {
  reason: string
  suggestion?: string
}

/** A link to a book page whose pages/N.md the author has not written yet. Not an error. */
export interface PendingLink extends ContentLink {
  /** Canonical route of the book. */
  book: string
  page: number
}

export interface LinkReport {
  /** Links that lead nowhere (wrong folder, unknown book, missing heading, page beyond the book...). */
  errors: BrokenLink[]
  /** Links to pages that are announced (pageCount / pages folder) but not written yet. */
  pending: PendingLink[]
}

export type LinkVerdict = { kind: 'ok' } | { kind: 'error'; reason: string; suggestion?: string } | { kind: 'pending'; book: string; page: number }

interface CheckOptions {
  quiet?: boolean
  strict?: boolean
  verbose?: boolean
}

interface CheckResult {
  /** The errors (what `--strict` fails on). */
  broken: BrokenLink[]
  pending: PendingLink[]
}

interface LinkReplacement {
  start: number
  end: number
  value: string
}

const MARKDOWN_LINK_PROCESSOR = unified().use(remarkParse).use(remarkDirective)
const SECTION_ROOT = /^\/(media|books)(?:\/|$)/

async function walkMarkdown(directory: string): Promise<string[]> {
  const files: string[] = []
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name !== 'story') await walk(path.join(current, entry.name))
      } else if (
        entry.isFile() &&
        (entry.name === 'index.md' ||
          /(?:^|\/)pages\/\d+\.md$/i.test(
            path.relative(directory, path.join(current, entry.name)).split(path.sep).join('/'),
          ))
      ) {
        files.push(path.join(current, entry.name))
      }
    }
  }
  await walk(directory)
  return files.sort((left, right) => left.localeCompare(right))
}

async function collectDirectories(directory: string, collection: CollectionId): Promise<Set<string>> {
  const directories = new Set<string>()
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'story' || entry.name === 'pages') continue
      const child = path.join(current, entry.name)
      const relative = path.relative(directory, child).split(path.sep).join('/')
      directories.add(`/${collection}/${relative}`)
      await walk(child)
    }
  }
  await walk(directory)
  return directories
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const value = node as { type?: string; value?: string; alt?: string; children?: unknown[] }
  if (typeof value.value === 'string') return value.value
  if (typeof value.alt === 'string') return value.alt
  return value.children?.map(nodeText).join('') ?? ''
}

export function extractHeadingIds(markdown: string): Set<string> {
  const body = matter(markdown.replace(/^\uFEFF/, '')).content
  const tree = MARKDOWN_LINK_PROCESSOR.parse(body)
  // A repeated heading that only marks the end of a section is not rendered, so it has no id either.
  markClosingHeadings(tree)
  removeClosingHeadings(tree)
  const slugger = new GithubSlugger()
  const ids = new Set<string>()
  visit(tree, 'heading', (node) => {
    ids.add(slugger.slug(nodeText(node)))
  })
  return ids
}

async function buildRouteTable(): Promise<RouteTable> {
  const articles: ArticleRoute[] = []
  const directories = new Set<string>(['/media', '/books'])
  for (const collection of Object.values(collections)) {
    for (const directory of await collectDirectories(collection.root, collection.id)) directories.add(directory)
    const files = await walkMarkdown(collection.root)
    const articleFiles = files.filter((file) => path.basename(file).toLowerCase() === 'index.md')
    for (const file of files) {
      const relative = path.relative(collection.root, file).split(path.sep).join('/')
      const slug = relative.replace(/\/pages\/\d+\.md$/i, '').replace(/\/index\.md$/i, '')
      const parts = slug.split('/').filter(Boolean)
      for (let index = 1; index <= parts.length; index += 1)
        directories.add(`/${collection.id}/${parts.slice(0, index).join('/')}`)
    }

    for (const file of articleFiles) {
      const slug = path.relative(collection.root, path.dirname(file)).split(path.sep).join('/')
      const pagesDirectory = path.join(path.dirname(file), 'pages')
      const pageFiles = files.filter((candidate) => path.dirname(candidate) === pagesDirectory)
      const frontmatter = parseBlog(
        await readFile(file, 'utf8'),
        path.relative(projectRoot, file).split(path.sep).join('/'),
      )
      const route: ArticleRoute = {
        collection: collection.id,
        slug,
        directory: path.dirname(file),
        aliases: frontmatter.aliases,
        ...(frontmatter.pageCount !== undefined ? { pageCount: frontmatter.pageCount } : {}),
        pages: new Set(
          pageFiles
            .map((candidate) => path.basename(candidate).match(/^(\d+)\.md$/i)?.[1])
            .filter((page): page is string => page !== undefined),
        ),
        headings: new Map(),
      }
      route.headings.set('', extractHeadingIds(await readFile(file, 'utf8')))
      for (const page of route.pages) {
        const pageFile = path.join(route.directory, 'pages', `${page}.md`)
        route.headings.set(page, extractHeadingIds(await readFile(pageFile, 'utf8')))
      }
      articles.push(route)
    }
    validateAliasUniqueness(
      articles.filter((article) => article.collection === collection.id),
      collection.id,
    )
    for (const article of articles.filter((item) => item.collection === collection.id)) {
      const articlePath = `/${collection.id}/${article.slug}`
      for (const directory of directories) {
        if (directory.startsWith(`${articlePath}/`)) directories.delete(directory)
      }
    }
  }

  return { articles, directories }
}

function routeWithBase(pathname: string): string {
  const base = '/Weblogs'
  return pathname === base || pathname.startsWith(`${base}/`) ? pathname.slice(base.length) || '/' : pathname
}

function decodePathname(pathname: string): string | null {
  try {
    return pathname
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/')
  } catch {
    return null
  }
}

function canonicalRoute(article: ArticleRoute, page?: string): string {
  return `/${article.collection}/${article.slug}${page ? `/${page}` : ''}`
}

export interface RouteMatch {
  article?: ArticleRoute
  page?: string
  directory?: string
  canonical?: string
}

export function resolveContentRoute(pathname: string, routes: RouteTable): RouteMatch | null {
  const decodedPath = decodePathname(routeWithBase(pathname))
  if (decodedPath === null) return null
  const normalizedPath = decodedPath.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/') return { directory: '/' }
  if (normalizedPath === '/media' || normalizedPath === '/books') return { directory: normalizedPath }
  const routeMatch = normalizedPath.match(SECTION_ROOT)
  if (!routeMatch) return null
  const collection = routeMatch[1] as CollectionId
  const routeRemainder = normalizedPath.slice(routeMatch[0].length).replace(/^\/+/, '')
  if (!routeRemainder) return { directory: `/${collection}` }

  const exact = routes.articles.find((article) => article.collection === collection && article.slug === routeRemainder)
  if (exact) return { article: exact, canonical: canonicalRoute(exact) }

  const pageMatch = routeRemainder.match(/^(.*)\/(\d+)$/)
  if (pageMatch) {
    const [, bookSlug, page] = pageMatch
    const book = routes.articles.find((article) => article.collection === collection && article.slug === bookSlug)
    if (book?.pages.has(page)) return { article: book, page, canonical: canonicalRoute(book, page) }

    const suffixCandidates = routes.articles.filter(
      (article) =>
        article.collection === collection &&
        (article.slug === bookSlug || article.slug.endsWith(`/${bookSlug}`)) &&
        article.pages.has(page),
    )
    if (suffixCandidates.length === 1) {
      return { article: suffixCandidates[0], page, canonical: canonicalRoute(suffixCandidates[0], page) }
    }
    if (suffixCandidates.length > 1) return null

    const [alias, ...rest] = bookSlug.split('/')
    const aliasCandidates = routes.articles.filter(
      (article) =>
        article.collection === collection &&
        article.aliases.includes(alias) &&
        (rest.length === 0 || rest.join('/') === path.posix.basename(article.slug)) &&
        article.pages.has(page),
    )
    if (aliasCandidates.length === 1) {
      return { article: aliasCandidates[0], page, canonical: canonicalRoute(aliasCandidates[0], page) }
    }
    return null
  }

  if (routes.directories.has(normalizedPath)) return { directory: normalizedPath }
  const suffixCandidates = routes.articles.filter(
    (article) => article.collection === collection && article.slug.endsWith(`/${routeRemainder}`),
  )
  if (suffixCandidates.length === 1) {
    return { article: suffixCandidates[0], canonical: canonicalRoute(suffixCandidates[0]) }
  }
  const [alias, ...rest] = routeRemainder.split('/')
  const aliasCandidates = routes.articles.filter(
    (article) =>
      article.collection === collection &&
      article.aliases.includes(alias) &&
      (rest.length === 0 || rest.join('/') === path.posix.basename(article.slug)),
  )
  if (aliasCandidates.length === 1) {
    return { article: aliasCandidates[0], canonical: canonicalRoute(aliasCandidates[0]) }
  }
  return null
}

/**
 * A page is "pending" when the book announced it but pages/N.md does not exist yet: 1..pageCount when the book
 * has `pageCount:`, else 1..10000 for a book that has a pages/ folder. (Same rule as the site's route resolution.)
 */
export function isPendingPage(article: ArticleRoute, page: string): boolean {
  const number = Number(page)
  if (!Number.isInteger(number) || number < 1 || article.pages.has(page)) return false
  if (article.pageCount !== undefined) return number <= article.pageCount
  return article.pages.size > 0 && number <= 10000
}

/**
 * The book a `/books/<book>/<N>` link means, found by exact slug, unique tail of the slug, or unique alias, WITHOUT
 * requiring page N to exist. null when no book (or several) match.
 */
export function resolveBookForPage(pathname: string, routes: RouteTable): { article: ArticleRoute; page: string } | null {
  const decoded = decodePathname(routeWithBase(pathname))
  if (decoded === null) return null
  const normalized = decoded.replace(/\/+$/, '')
  const sectionMatch = normalized.match(SECTION_ROOT)
  if (!sectionMatch) return null
  const collection = sectionMatch[1] as CollectionId
  const remainder = normalized.slice(sectionMatch[0].length).replace(/^\/+/, '')
  const pageMatch = remainder.match(/^(.*)\/(\d+)$/)
  if (!pageMatch) return null
  const [, bookSlug, page] = pageMatch
  const inCollection = routes.articles.filter((article) => article.collection === collection)

  const exact = inCollection.find((article) => article.slug === bookSlug)
  if (exact) return { article: exact, page }
  const byTail = inCollection.filter((article) => article.slug.endsWith(`/${bookSlug}`))
  if (byTail.length === 1) return { article: byTail[0], page }
  if (byTail.length > 1) return null
  const [alias, ...rest] = bookSlug.split('/')
  const byAlias = inCollection.filter(
    (article) => article.aliases.includes(alias) && (rest.length === 0 || rest.join('/') === path.posix.basename(article.slug)),
  )
  return byAlias.length === 1 ? { article: byAlias[0], page } : null
}

/** Judges one link. Pure (no file access), so it can be tested. */
export function classifyLink(link: ContentLink, routes: RouteTable): LinkVerdict {
  const { pathname, fragment } = fragmentFor(link.href)
  const route = resolveContentRoute(pathname, routes)
  if (!route) {
    const book = resolveBookForPage(pathname, routes)
    if (book) {
      if (isPendingPage(book.article, book.page)) return { kind: 'pending', book: canonicalRoute(book.article), page: Number(book.page) }
      const limit = book.article.pageCount !== undefined ? ` (the book has ${book.article.pageCount} pages)` : ''
      return { kind: 'error', reason: `book page does not exist${limit}`, suggestion: canonicalRoute(book.article) }
    }
    const suggestion = suggestCanonicalPath(pathname, routes)
    return {
      kind: 'error',
      reason: /\/\d+$/.test(pathname) ? 'book page does not exist' : 'route does not exist',
      ...(suggestion ? { suggestion } : {}),
    }
  }
  // `#t=2m30s&v=2` points at a moment of a video, not at a heading.
  if (fragment && !parseVideoHash(fragment)) {
    const headings = route.article?.headings.get(route.page ?? '')
    if (!headings?.has(fragment)) {
      return { kind: 'error', reason: `heading fragment "${fragment}" does not exist`, ...(route.canonical ? { suggestion: route.canonical } : {}) }
    }
  }
  return { kind: 'ok' }
}

export function suggestCanonicalPath(pathname: string, routes: RouteTable): string | undefined {
  const normalizedPath = routeWithBase(pathname).replace(/\/+$/, '')
  const routeMatch = normalizedPath.match(SECTION_ROOT)
  if (!routeMatch) return undefined
  const collection = routeMatch[1] as CollectionId
  const remainder = normalizedPath.slice(routeMatch[0].length).replace(/^\/+/, '')
  const pageMatch = remainder.match(/^(.*)\/(\d+)$/)
  const suffix = pageMatch?.[1] ?? remainder
  const page = pageMatch?.[2]
  const suffixCandidates = routes.articles.filter(
    (article) =>
      article.collection === collection &&
      (article.slug === suffix || article.slug.endsWith(`/${suffix}`)),
  )
  if (suffixCandidates.length === 1) return canonicalRoute(suffixCandidates[0], page)
  if (suffixCandidates.length > 1) return undefined
  const alias = suffix.split('/')[0]
  const aliasCandidates = routes.articles.filter(
    (article) => article.collection === collection && article.aliases.includes(alias),
  )
  return aliasCandidates.length === 1 ? canonicalRoute(aliasCandidates[0], page) : undefined
}

function fragmentFor(href: string): { pathname: string; fragment: string } {
  const hashIndex = href.indexOf('#')
  const beforeHash = hashIndex < 0 ? href : href.slice(0, hashIndex)
  const queryIndex = beforeHash.indexOf('?')
  let fragment = hashIndex < 0 ? '' : href.slice(hashIndex + 1)
  try {
    fragment = decodeURIComponent(fragment)
  } catch {
    // Keep malformed fragments literal so they are reported as missing.
  }
  return { pathname: queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex), fragment }
}

function sourceLine(markdown: string, href: string, line: number, cursorByLine: Map<number, number>): ContentLink {
  const lines = markdown.split(/\r?\n/)
  const lineText = lines[line - 1] ?? ''
  const cursor = cursorByLine.get(line) ?? 0
  let start = lineText.indexOf(href, cursor)
  if (start < 0) start = lineText.indexOf(href)
  if (start < 0) return { file: '', line, href, start: -1, end: -1 }
  cursorByLine.set(line, start + href.length)
  let offset = 0
  for (let currentLine = 1; currentLine < line; currentLine += 1) {
    const newlineIndex = markdown.indexOf('\n', offset)
    if (newlineIndex < 0) {
      offset = markdown.length
      break
    }
    offset = newlineIndex + 1
  }
  return { file: '', line, href, start: offset + start, end: offset + start + href.length }
}

export function extractInternalLinks(markdown: string): ContentLink[] {
  const links: ContentLink[] = []
  const tree = MARKDOWN_LINK_PROCESSOR.parse(markdown.replace(/^\uFEFF/, ''))
  const cursors = new Map<number, number>()

  visit(tree, (node) => {
    const item = node as {
      type?: string
      url?: unknown
      value?: unknown
      name?: string
      attributes?: Record<string, unknown>
      position?: { start: { line: number } }
    }
    const line = item.position?.start.line ?? 1
    const values: string[] = []
    if (item.type === 'link' && typeof item.url === 'string') values.push(item.url)
    if (item.type === 'html' && typeof item.value === 'string') {
      const regex = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi
      for (const match of item.value.matchAll(regex)) values.push(match[2])
    }
    const isLinkDirective =
      (item.type === 'textDirective' && item.name === 'button') ||
      (['leafDirective', 'containerDirective'].includes(item.type ?? '') &&
        ['button', 'suggested', 'source'].includes(item.name ?? ''))
    if (isLinkDirective && item.attributes) {
      for (const [attribute, value] of Object.entries(item.attributes)) {
        if ((attribute === 'href' || attribute === 'url') && typeof value === 'string') values.push(value)
      }
    }
    for (const href of values.filter((value) => value.startsWith('/'))) {
      links.push(sourceLine(markdown, href, line, cursors))
    }
  })

  return links
}

export async function inspectContentLinks(): Promise<LinkReport> {
  const routes = await buildRouteTable()
  const report: LinkReport = { errors: [], pending: [] }
  const contentRoot = path.join(projectRoot, 'content')
  const files = await walkMarkdown(contentRoot)

  for (const file of files) {
    const markdown = await readFile(file, 'utf8')
    const label = path.relative(projectRoot, file).split(path.sep).join('/')
    for (const link of extractInternalLinks(markdown)) {
      const verdict = classifyLink(link, routes)
      if (verdict.kind === 'error') {
        report.errors.push({ ...link, file: label, reason: verdict.reason, ...(verdict.suggestion ? { suggestion: verdict.suggestion } : {}) })
      } else if (verdict.kind === 'pending') {
        report.pending.push({ ...link, file: label, book: verdict.book, page: verdict.page })
      }
    }
  }
  return report
}

/** "27, 28, 29 ... (and 172 more)" for the pending-pages summary. */
function listPages(pages: number[], limit = 10): string {
  const sorted = [...new Set(pages)].sort((left, right) => left - right)
  const shown = sorted.slice(0, limit).join(', ')
  return sorted.length > limit ? `${shown} ... (+${sorted.length - limit} more)` : shown
}

export async function checkContentLinks(options: CheckOptions = {}): Promise<CheckResult> {
  const { errors, pending } = await inspectContentLinks()
  const pendingPages = new Set(pending.map((link) => `${link.book}/${link.page}`)).size

  if (options.quiet) {
    console.log(`Internal links: ${errors.length} broken, ${pending.length} to pages not written yet.`)
  } else {
    const grouped = new Map<string, BrokenLink[]>()
    for (const link of errors) grouped.set(link.file, [...(grouped.get(link.file) ?? []), link])
    for (const [file, links] of grouped) {
      console.warn(file)
      for (const link of links) {
        const suggestion = link.suggestion ? ` (did you mean ${link.suggestion}?)` : ''
        console.warn(`  ${file}:${link.line}  ${link.href}  ->  ${link.reason}${suggestion}`)
      }
    }
    console.log(errors.length > 0 ? `Internal links: ${errors.length} broken link(s).` : 'Internal links: 0 broken links.')

    if (pending.length > 0) {
      console.log(`Pages not written yet (not an error): ${pending.length} link(s) to ${pendingPages} page(s).`)
      const byBook = new Map<string, PendingLink[]>()
      for (const link of pending) byBook.set(link.book, [...(byBook.get(link.book) ?? []), link])
      for (const [book, links] of byBook) {
        console.log(`  ${book}: ${links.length} link(s); pages ${listPages(links.map((link) => link.page))}`)
        if (options.verbose) for (const link of links) console.log(`    ${link.file}:${link.line}  ${link.href}`)
      }
      if (!options.verbose) console.log('  (run with --verbose to list every link)')
    }
  }
  if (options.strict && errors.length > 0) process.exitCode = 1
  return { broken: errors, pending }
}

export function rewriteResolvableLinks(
  markdown: string,
  routes: RouteTable,
): {
  markdown: string
  replacements: LinkReplacement[]
} {
  const replacements: LinkReplacement[] = []
  for (const link of extractInternalLinks(markdown)) {
    const { pathname } = fragmentFor(link.href)
    const strippedPath = routeWithBase(pathname)
    const match = resolveContentRoute(strippedPath, routes)
    const suggestion =
      match?.canonical ??
      (match?.directory ? strippedPath.replace(/\/+$/, '') || '/' : suggestCanonicalPath(strippedPath, routes))
    if (!suggestion || suggestion === pathname || link.start < 0) continue
    const suffix = link.href.slice(pathname.length)
    replacements.push({ start: link.start, end: link.end, value: `${suggestion}${suffix}` })
  }

  let updated = markdown
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    updated = `${updated.slice(0, replacement.start)}${replacement.value}${updated.slice(replacement.end)}`
  }
  return { markdown: updated, replacements }
}

export async function fixLinks(folder: string, dryRun: boolean): Promise<void> {
  const routes = await buildRouteTable()
  const target = path.isAbsolute(folder) ? folder : path.resolve(projectRoot, folder)
  const files = await walkMarkdown(target)
  let changedFiles = 0
  let changedLinks = 0

  for (const file of files) {
    const originalBuffer = await readFile(file)
    const hasBom = originalBuffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))
    const original = originalBuffer.toString('utf8')
    const { markdown: updated, replacements } = rewriteResolvableLinks(original, routes)
    if (replacements.length === 0) continue
    if (updated === original) continue
    changedFiles += 1
    changedLinks += replacements.length
    for (const replacement of replacements) {
      const before = original.slice(replacement.start, replacement.end)
      console.log(
        `  line ${original.slice(0, replacement.start).split(/\r?\n/).length}: ${before} -> ${replacement.value}`,
      )
    }
    console.log(
      `${path.relative(projectRoot, file).split(path.sep).join('/')}: ${replacements.length} link(s) ${dryRun ? 'would change' : 'changed'}`,
    )
    if (!dryRun) {
      const withoutBom = updated.replace(/^\uFEFF/, '')
      await writeFile(file, withoutBom, 'utf8')
    } else if (hasBom) {
      console.log('  (BOM will be removed)')
    }
  }
  console.log(
    `fixLinks: ${changedLinks} link(s) in ${changedFiles} file(s) ${dryRun ? 'would be changed' : 'updated'}.`,
  )
}
