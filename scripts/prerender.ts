/*
  Meta-only prerender, run after `vite build`.
  For every article it writes dist/<category>/<path>/index.html: a copy of dist/index.html
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
  /** URL prefix of the items, e.g. `media` → dist/media/<path>/index.html */
  route: 'media' | 'books'
  meta: string
  hidden: string
}

async function main(): Promise<void> {
  const template = await readFile(path.join(distRoot, 'index.html'), 'utf8')
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  const targets: PrerenderTarget[] = [
    { route: 'media', meta: 'media.json', hidden: 'media-hidden.json' },
    { route: 'books', meta: 'books.json', hidden: 'books-hidden.json' },
  ]
  let totalItems = 0
  let totalHidden = 0

  for (const target of targets) {
    const articles = await readJson<ArticleMeta[]>(target.meta)
    totalItems += articles.length

    for (const item of articles) {
      // A book is written to disk once for its introduction and once per page file (`/books/<book>/<page>`).
      const variants = [
        { sub: '', label: item.title },
        ...(item.pages ?? []).map((page) => ({
          sub: String(page.number),
          label: `${item.title} — صفحه ${page.number}`,
        })),
      ]
      for (const variant of variants) {
        const article = { ...item, title: variant.label }
        const url = `${base}/${target.route}/${item.slug}${variant.sub ? `/${variant.sub}` : ''}`
        const title = `${article.title} | ${siteConfig.siteName}`
        const image =
          article.cover?.type === 'image'
            ? new URL(article.cover.url, base).toString()
            : article.cover?.type === 'embed' && article.cover.poster
              ? article.cover.poster
              : undefined
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
        ]
          .filter(Boolean)
          .join('\n    ')

        const staticMarkup = `<main id="main-content" class="prerender"><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.description)}</p></main>`
        const html = template
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>\n    ${head}`)
          .replace(
            /<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/,
            `<div id="root">${staticMarkup}</div>\n  <noscript>${staticMarkup}</noscript>`,
          )
        if (!html.includes('class="prerender"'))
          throw new Error('prerender: could not find <div id="root"> in dist/index.html')

        const folder = path.join(distRoot, target.route, item.slug, variant.sub)
        await mkdir(folder, { recursive: true })
        await writeFile(path.join(folder, 'index.html'), html, 'utf8')
      }
    }

    // Pages hidden with `show: false`: a plain copy of the app shell (no text, not indexed), so the address opens
    // the app, which then shows the «the admin does not allow this page» screen.
    const hidden = await readJson<string[]>(target.hidden)
    totalHidden += hidden.length
    for (const slug of hidden) {
      const html = template.replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${escapeHtml(siteConfig.siteName)}</title>\n    <meta name="robots" content="noindex, nofollow" />`,
      )
      const folder = path.join(distRoot, target.route, slug)
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, 'index.html'), html, 'utf8')
    }

    const listingPaths = new Set<string>()
    for (const article of articles) {
      const segments = article.slug.split('/')
      for (let index = 1; index < segments.length; index += 1) listingPaths.add(segments.slice(0, index).join('/'))
    }
    for (const slug of listingPaths) {
      const folderName = slug.split('/').at(-1)!.split(/[-_]+/).join(' ')
      const description = `محتوای دستهٔ ${folderName}`
      const title = `${folderName} | ${siteConfig.siteName}`
      const url = `${base}/${target.route}/${slug}`
      const markup = `<main id="main-content" class="prerender"><h1>${escapeHtml(folderName)}</h1><p>${escapeHtml(description)}</p></main>`
      const head = [
        `<meta name="description" content="${escapeHtml(description)}" />`,
        `<link rel="canonical" href="${escapeHtml(url)}" />`,
      ].join('\n    ')
      const html = template
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>\n    ${head}`)
        .replace(
          /<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/,
          `<div id="root">${markup}</div>\n  <noscript>${markup}</noscript>`,
        )
      const folder = path.join(distRoot, target.route, ...slug.split('/'))
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, 'index.html'), html, 'utf8')
    }
  }

  const media = await readJson<ArticleMeta[]>('media.json')
  const leafMatches = new Map<string, ArticleMeta[]>()
  for (const article of media) {
    const leaf = article.slug.split('/').at(-1)!
    leafMatches.set(leaf, [...(leafMatches.get(leaf) ?? []), article])
  }
  const legacyLeaves = new Set([...leafMatches.keys(), ''])
  for (const leaf of legacyLeaves) {
    const match = leafMatches.get(leaf)
    const target = match?.length === 1 ? `/media/${match[0].slug}` : '/media'
    const redirectUrl = `${base}${target}`
    const html = template
      .replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>انتقال به رسانه‌ها | ${escapeHtml(siteConfig.siteName)}</title>\n    <meta name="robots" content="noindex, follow" />`,
      )
      .replace(
        /<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/,
        `<div id="root"><main id="main-content"><p>این نشانی جابه‌جا شده است.</p><a href="${escapeHtml(redirectUrl)}">ادامه به رسانه‌ها</a></main></div>\n  <script>location.replace(${JSON.stringify(redirectUrl)} + location.search + location.hash)</script>`,
      )
    const folder = path.join(distRoot, 'blog', ...leaf.split('/').filter(Boolean))
    await mkdir(folder, { recursive: true })
    await writeFile(path.join(folder, 'index.html'), html, 'utf8')
  }

  for (const [route, label, description] of [
    ['books', 'کتاب‌ها', 'کتاب‌های معرفی‌شده و منابع مطالعه؛ در عنوان و متن کتاب‌ها جست‌وجو کنید.'],
    ['media', 'رسانه‌ها', 'مقاله‌ها، ویدیوها و رسانه‌های آموزشی.'],
  ]) {
    const heading = `${label} | ${siteConfig.siteName}`
    const head = [
      `<meta name="description" content="${escapeHtml(description)}" />`,
      `<link rel="canonical" href="${escapeHtml(`${base}/${route}`)}" />`,
      `<meta property="og:title" content="${escapeHtml(heading)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    ].join('\n    ')
    const markup = `<main id="main-content" class="prerender"><h1>${label}</h1><p>${escapeHtml(description)}</p></main>`
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(heading)}</title>\n    ${head}`)
      .replace(
        /<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/,
        `<div id="root">${markup}</div>\n  <noscript>${markup}</noscript>`,
      )
    await mkdir(path.join(distRoot, route), { recursive: true })
    await writeFile(path.join(distRoot, route, 'index.html'), html, 'utf8')
  }

  console.log(`Prerendered meta for ${totalItems} item(s) and the books page; ${totalHidden} hidden page(s).`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
