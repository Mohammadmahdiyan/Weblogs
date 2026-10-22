import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Headphones, Play } from 'lucide-react'
import articlesJson from '../generated/articles.json'
import searchJson from '../generated/search-index.json'
import type { ArticleMeta, SearchEntry } from '../lib/types'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'
import { ArticleSearch } from '../components/ArticleSearch'
import { FontControls } from '../components/FontControls'
import { AdultArticleNotice } from '../components/AdultArticleNotice'
import { useAdultAccess } from '../lib/adultAccess'
import { NoImage } from '../components/NoImage'
import { ImageWithFallback } from '../components/ImageWithFallback'

const allArticles = [...articlesJson as ArticleMeta[]].sort((first, second) => second.date.localeCompare(first.date))
const searchIndex = searchJson as SearchEntry[]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(`${date}T12:00:00`))
}

function ArticleCover({ article }: { article: ArticleMeta }) {
  if (article.cover?.type === 'image') {
    return <ImageWithFallback src={article.cover.url} alt="" loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
  }
  if (article.cover?.type === 'video') {
    return <div className="relative flex aspect-video items-center justify-center bg-[var(--surface-strong)] text-[var(--text-muted)]"><Play aria-hidden="true" className="size-9" /><span className="sr-only">ویدیو</span></div>
  }
  if (article.cover?.type === 'embed') {
    return article.cover.poster
      ? <div className="relative"><ImageWithFallback src={article.cover.poster} alt="" loading="lazy" decoding="async" className="aspect-video w-full object-cover" /><span aria-hidden="true" className="absolute inset-0 grid place-items-center"><span className="grid size-12 place-items-center rounded-full bg-black/60 text-white"><Play className="size-5" /></span></span><span className="sr-only">ویدیو</span></div>
      : <div className="relative flex aspect-video items-center justify-center bg-[var(--surface-strong)] text-[var(--text-muted)]"><Play aria-hidden="true" className="size-9" /><span className="sr-only">محتوای جاسازی‌شده</span></div>
  }
  if (article.cover?.type === 'audio') {
    return <div className="flex aspect-video items-center justify-center bg-[var(--surface-alt)] text-[var(--brand)]"><Headphones aria-hidden="true" className="size-9" /><span className="sr-only">صوت</span></div>
  }
  return <NoImage/>
}

function ArticleCard({ article, adultConfirmed }: { article: ArticleMeta; adultConfirmed: boolean }) {
  const censored = article.adult === true && !adultConfirmed
  const hasCover = true
  return (
    <article className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      {hasCover && (
        <Link to={`/blog/${article.slug}`} aria-label={censored ? 'مشاهده مقاله +۱۸' : `خواندن ${article.title}`} className="relative block overflow-hidden bg-[var(--surface-alt)]">
          {censored ? <div className="relative aspect-video overflow-hidden"><div className="pointer-events-none scale-110 blur-xl" aria-hidden="true"><ArticleCover article={article} /></div><div className="absolute inset-0 grid place-items-center bg-[var(--surface)]/75"><AdultArticleNotice compact /></div></div> : <ArticleCover article={article} />}
        </Link>
      )}
      {censored && !hasCover && <Link to={`/blog/${article.slug}`} aria-label="مشاهده مقاله +۱۸" className="block border-b border-[var(--border-light)] bg-[var(--surface-alt)] no-underline"><AdultArticleNotice /></Link>}
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <h2 className="mb-2 text-start text-lg font-bold leading-8">
          <Link to={`/blog/${article.slug}`} className="text-[var(--text)] no-underline hover:text-[var(--brand)]">{censored ? <span className="relative block"><span className="block select-none blur-sm">{article.title}</span><span className="absolute inset-0 flex items-center justify-center"><AdultArticleNotice compact /></span></span> : article.title}</Link>
        </h2>
        <p className="mb-4 line-clamp-3 text-start text-sm leading-7 text-[var(--text-secondary)]">{censored ? <span className="relative block"><span className="block select-none blur-sm">{article.description}</span><span className="absolute inset-0 flex items-center justify-center"><span className="rounded bg-[var(--surface)]/90 px-2 py-1 text-xs font-semibold">حاوی جملات +۱۸</span></span></span> : article.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          {!censored && <span>{article.readingTime} دقیقه مطالعه</span>}
        </div>
        {!censored && <ul className="mt-4 flex flex-wrap gap-2 p-0">
          {article.tags.map((tag) => <li key={tag} className="list-none rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{tag}</li>)}
        </ul>}
      </div>
    </article>
  )
}

export function HomePage() {
  const [searchParams] = useSearchParams()
  const adultConfirmed = useAdultAccess()
  usePageMeta({
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  })
  const [visibleCount, setVisibleCount] = useState(12)
  const visibleArticles = useMemo(() => allArticles.slice(0, visibleCount), [visibleCount])

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 text-center sm:mb-14">
        <h1 className="mb-3 text-3xl font-extrabold leading-tight sm:text-4xl">{siteConfig.siteName}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{siteConfig.siteDescription}</p>
        <ArticleSearch articles={allArticles} searchIndex={searchIndex} initialQuery={searchParams.get('q') ?? ''} />
        <div className="mt-5 flex justify-center">
          <FontControls />
        </div>
      </section>

      <section id="articles" aria-labelledby="articles-heading">
        <div className="mb-5">
          <h2 id="articles-heading" className="m-0 text-start text-xl font-bold">همه مقاله‌ها</h2>
        </div>
        {visibleArticles.length ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {visibleArticles.map((article) => <ArticleCard key={article.slug} article={article} adultConfirmed={adultConfirmed} />)}
          </div>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center text-[var(--text-secondary)]">هنوز مقاله‌ای منتشر نشده است.</p>
        )}
        {visibleCount < allArticles.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)]">نمایش مقاله‌های بیشتر</button></div>}
      </section>
    </main>
  )
}