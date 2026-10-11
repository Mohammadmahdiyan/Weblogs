import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ArticleMeta } from '../src/lib/types.ts'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedRoot = path.join(projectRoot, 'src', 'generated')
const distRoot = path.join(projectRoot, 'dist')
const blogDistRoot = path.join(distRoot, 'blog')

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMetaTags(article: ArticleMeta): string {
  const siteName = 'وبلاگ اسلامی'
  const title = `${article.title} | ${siteName}`
  const description = article.description
  const baseUrl = 'https://example.com'
  const canonicalUrl = `${baseUrl}/blog/${article.slug}`
  const imageUrl = article.cover?.type === 'image' ? article.cover.url : undefined

  const metaTags: string[] = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:locale" content="fa_IR" />`,
    `<meta property="og:site" content="${escapeHtml(siteName)}" />`,
  ]

  if (imageUrl) {
    const absoluteImage = new URL(imageUrl, baseUrl).toString()
    metaTags.push(
      `<meta property="og:image" content="${escapeHtml(absoluteImage)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />`,
    )
  } else {
    metaTags.push(`<meta name="twitter:card" content="summary" />`)
  }

  metaTags.push(
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    image: imageUrl ? new URL(imageUrl, baseUrl).toString() : `${baseUrl}/favicon.svg`,
    author: { '@type': 'Person', name: siteName },
    keywords: article.tags.join(', '),
    url: canonicalUrl,
  }

  return `${metaTags.join('\n    ')}\n    <script type="application/ld+json" id="seo-json-ld">${JSON.stringify(jsonLd)}</script>`
}

function buildShellHtml(article: ArticleMeta): string {
  const metaTags = buildMetaTags(article)

  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
${metaTags}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <a href="#main-content" class="skip-link absolute top-4 start-4 z-50 rounded bg-[var(--brand)] px-4 py-2 text-xs font-medium text-[var(--brand-contrast)] underline">پرش به محتوا</a>
    <main id="main-content" class="mx-auto w-full max-w-4xl px-4 py-12">
      <header class="mb-12 text-center">
        <h1 class="text-3xl font-extrabold leading-tight sm:text-4xl">${escapeHtml(article.title)}</h1>
        <time class="mt-4 block text-sm text-[var(--text-secondary)]">${new Date(article.date).toLocaleDateString('fa-IR')}</time>
      </header>
      <article>
        <noscript>
          ${article.description ? `<p>${escapeHtml(article.description)}</p>` : ''}
          برای مشاهده کامل مقاله، جاوااسکریپت مرورگر خود را فعال کنید.
        </noscript>
      </article>
    </main>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
}

async function prerender(): Promise<void> {
  const articlesFile = path.join(generatedRoot, 'articles.json')
  const articlesJson = JSON.parse(await readFile(articlesFile, 'utf8')) as ArticleMeta[]
  const articles = articlesJson.sort((a, b) => b.date.localeCompare(a.date))

  await mkdir(blogDistRoot, { recursive: true })

  let count = 0
  for (const article of articles) {
    const articleDir = path.join(blogDistRoot, article.slug)
    await mkdir(articleDir, { recursive: true })

    const shellPath = path.join(articleDir, 'index.html')
    await writeFile(shellPath, buildShellHtml(article), 'utf8')
    count++
  }

  console.log(`Prerendered ${count} article shells`)
}

prerender().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
