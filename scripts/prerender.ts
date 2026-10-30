/*
  Meta-only prerender, run after `vite build`.
  For every article it writes dist/blog/<slug>/index.html: a copy of dist/index.html
  with the article's <title>, description, canonical, Open Graph / Twitter tags,
  JSON-LD, the <h1> and a short description inside #root and in <noscript>.
  The SPA still boots and replaces the static markup normally.

  Limitation: the article BODY is not prerendered (only title + description), so
  crawlers that do not run JavaScript see the h1 and summary, not the full text.
*/
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import siteConfig from '../src/site.config.ts'
import type { ArticleMeta } from '../src/lib/types.ts'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(projectRoot, 'dist')

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(projectRoot, 'src', 'generated', name), 'utf8')) as T
}

interface PrerenderTarget {
  /** URL prefix of the items, e.g. `blog` → dist/blog/<slug>/index.html */
  route: 'blog' | 'books'
  meta: string
  hidden: string
}

async function main(): Promise<void> {
  const template = await readFile(path.join(distRoot, 'index.html'), 'utf8')
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  const targets: PrerenderTarget[] = [
    { route: 'blog', meta: 'articles.json', hidden: 'hidden.json' },
    { route: 'books', meta: 'books.json', hidden: 'books-hidden.json' },
  ]
  let totalItems = 0
  let totalHidden = 0

  for (const target of targets) {
    const articles = await readJson<ArticleMeta[]>(target.meta)
    totalItems += articles.length

    for (const article of articles) {
      const url = `${base}/${target.route}/${article.slug}`
      const title = `${article.title} | ${siteConfig.siteName}`
      const image = article.cover?.type === 'image'
        ? new URL(article.cover.url, base).toString()
        : article.cover?.type === 'embed' && article.cover.poster ? article.cover.poster : undefined
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.date,
        dateModified: article.updated,
        mainEntityOfPage: url,
        ...(image ? { image } : {}),
        publisher: { '@type': 'Organization', name: siteConfig.siteName },
      }

      const head = [
        `<meta name="description" content="${escapeHtml(article.description)}" />`,
        `<link rel="canonical" href="${escapeHtml(url)}" />`,
        `<meta property="og:type" content="article" />`,
        `<meta property="og:title" content="${escapeHtml(title)}" />`,
        `<meta property="og:description" content="${escapeHtml(article.description)}" />`,
        `<meta property="og:url" content="${escapeHtml(url)}" />`,
        `<meta property="og:site_name" content="${escapeHtml(siteConfig.siteName)}" />`,
        image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
        `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(article.description)}" />`,
        `<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`,
      ].filter(Boolean).join('\n    ')

      const staticMarkup = `<main id="main-content" class="prerender"><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.description)}</p></main>`
      const html = template
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>\n    ${head}`)
        .replace(/<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/, `<div id="root">${staticMarkup}</div>\n  <noscript>${staticMarkup}</noscript>`)
      if (!html.includes('class="prerender"')) throw new Error('prerender: could not find <div id="root"> in dist/index.html')

      const folder = path.join(distRoot, target.route, article.slug)
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, 'index.html'), html, 'utf8')
    }

    // Pages hidden with `show: false`: a plain copy of the app shell (no text, not indexed), so the address opens
    // the app, which then shows the «the admin does not allow this page» screen.
    const hidden = await readJson<string[]>(target.hidden)
    totalHidden += hidden.length
    for (const slug of hidden) {
      const html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(siteConfig.siteName)}</title>\n    <meta name="robots" content="noindex, nofollow" />`)
      const folder = path.join(distRoot, target.route, slug)
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, 'index.html'), html, 'utf8')
    }
  }

  // The books list page (/books): the app shell with its own title and description (the blog list is the home page).
  const booksTitle = `کتاب‌ها | ${siteConfig.siteName}`
  const booksDescription = 'کتاب‌های معرفی‌شده و منابع مطالعه؛ در عنوان و متن کتاب‌ها جست‌وجو کنید.'
  const booksHead = [
    `<meta name="description" content="${escapeHtml(booksDescription)}" />`,
    `<link rel="canonical" href="${escapeHtml(`${base}/books`)}" />`,
    `<meta property="og:title" content="${escapeHtml(booksTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(booksDescription)}" />`,
  ].join('\n    ')
  const booksMarkup = `<main id="main-content" class="prerender"><h1>کتاب‌ها</h1><p>${escapeHtml(booksDescription)}</p></main>`
  const booksHtml = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(booksTitle)}</title>\n    ${booksHead}`)
    .replace(/<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/, `<div id="root">${booksMarkup}</div>\n  <noscript>${booksMarkup}</noscript>`)
  await mkdir(path.join(distRoot, 'books'), { recursive: true })
  await writeFile(path.join(distRoot, 'books', 'index.html'), booksHtml, 'utf8')

  console.log(`Prerendered meta for ${totalItems} item(s) and the books page; ${totalHidden} hidden page(s).`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
