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

async function main(): Promise<void> {
  const template = await readFile(path.join(distRoot, 'index.html'), 'utf8')
  const articles = JSON.parse(await readFile(path.join(projectRoot, 'src', 'generated', 'articles.json'), 'utf8')) as ArticleMeta[]
  const base = siteConfig.siteUrl.replace(/\/+$/, '')

  for (const article of articles) {
    const url = `${base}/blog/${article.slug}`
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
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>\n    ${head}`)
      .replace(/<div id="root">[\s\S]*<\/div>(?=\s*(?:<script[^>]*><\/script>\s*)*<\/body>)/, `<div id="root">${staticMarkup}</div>\n  <noscript>${staticMarkup}</noscript>`)
    if (!html.includes('class="prerender"')) throw new Error('prerender: could not find <div id="root"> in dist/index.html')

    const target = path.join(distRoot, 'blog', article.slug)
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, 'index.html'), html, 'utf8')
  }

  // Pages hidden with `show: false`: a plain copy of the app shell (no article text, not indexed), so the
  // address opens the app, which then shows the «the admin does not allow this page» screen.
  const hidden = JSON.parse(await readFile(path.join(projectRoot, 'src', 'generated', 'hidden.json'), 'utf8')) as string[]
  for (const slug of hidden) {
    const html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(siteConfig.siteName)}</title>\n    <meta name="robots" content="noindex, nofollow" />`)
    const target = path.join(distRoot, 'blog', slug)
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, 'index.html'), html, 'utf8')
  }
  console.log(`Prerendered meta for ${articles.length} article(s); ${hidden.length} hidden page(s).`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
