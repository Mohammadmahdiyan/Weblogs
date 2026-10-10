import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Grid2X2, Headphones, List, Play } from 'lucide-react'
import { clsx } from 'clsx'
import articlesJson from '../generated/articles.json'
import searchJson from '../generated/search-index.json'
import type { ArticleMeta, SearchEntry } from '../lib/types'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'
import { ArticleSearch } from '../components/ArticleSearch'
import { FontControls } from '../components/ThemeControls'

const allArticles = [...articlesJson as ArticleMeta[]].sort((first, second) => second.date.localeCompare(first.date))
const searchIndex = searchJson as SearchEntry[]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(`${date}T12:00:00`))
}

function ArticleCover({ article }: { article: ArticleMeta }) {
  if (article.cover?.type === 'image') {
    return <img src={article.cover.url} alt="" loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
  }
  if (article.cover?.type === 'video') {
    return <div className="relative flex aspect-video items-center justify-center bg-[var(--surface-strong)] text-[var(--text-muted)]"><Play aria-hidden="true" className="size-9" /><span className="sr-only">ویدیو</span></div>
  }
  if (article.cover?.type === 'audio') {
    return <div className="flex aspect-video items-center justify-center bg-[var(--surface-alt)] text-[var(--brand)]"><Headphones aria-hidden="true" className="size-9" /><span className="sr-only">صوت</span></div>
  }
  return null
}

function ArticleCard({ article, list }: { article: ArticleMeta; list: boolean }) {
  const hasCover = article.cover !== null
  return (
    <article className={clsx('overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5', list && 'sm:flex')}>
      {hasCover && (
        <Link to={`/blog/${article.slug}`} aria-label={`خواندن ${article.title}`} className={clsx('block overflow-hidden bg-[var(--surface-alt)]', list && 'sm:w-56 sm:shrink-0')}>
          <ArticleCover article={article} />
        </Link>
      )}
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <h2 className="mb-2 text-start text-lg font-bold leading-8">
          <Link to={`/blog/${article.slug}`} className="text-[var(--text)] no-underline hover:text-[var(--brand)]">{article.title}</Link>
        </h2>
        <p className="mb-4 line-clamp-3 text-start text-sm leading-7 text-[var(--text-secondary)]">{article.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <span>{article.readingTime} دقیقه مطالعه</span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2 p-0">
          {article.tags.map((tag) => <li key={tag} className="list-none rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{tag}</li>)}
        </ul>
      </div>
    </article>
  )
}

export function HomePage() {
  usePageMeta({ title: siteConfig.siteName, description: siteConfig.siteDescription })
  const [view, setView] = useState<'grid' | 'list'>(() => localStorage.getItem('article-view') === 'list' ? 'list' : 'grid')
  const [visibleCount, setVisibleCount] = useState(12)
  const visibleArticles = useMemo(() => allArticles.slice(0, visibleCount), [visibleCount])

  useEffect(() => localStorage.setItem('article-view', view), [view])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 text-center sm:mb-14">
        <h1 className="mb-3 text-3xl font-extrabold leading-tight sm:text-4xl">{siteConfig.siteName}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{siteConfig.siteDescription}</p>
        <ArticleSearch articles={allArticles} searchIndex={searchIndex} />
        <div className="mt-5 flex justify-center">
          <FontControls />
        </div>
      </section>

      <section id="articles" aria-labelledby="articles-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="articles-heading" className="m-0 text-start text-xl font-bold">همه مقاله‌ها</h2>
          <div role="group" aria-label="نمایش مقاله‌ها" className="inline-flex rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] p-1">
            <button type="button" onClick={() => setView('grid')} aria-label="نمای شبکه‌ای" aria-pressed={view === 'grid'} className={clsx('rounded-[var(--radius-sm)] p-2', view === 'grid' ? 'bg-[var(--surface-strong)] text-[var(--brand)]' : 'text-[var(--muted)]')}><Grid2X2 aria-hidden="true" className="size-4" /></button>
            <button type="button" onClick={() => setView('list')} aria-label="نمای فهرستی" aria-pressed={view === 'list'} className={clsx('rounded-[var(--radius-sm)] p-2', view === 'list' ? 'bg-[var(--surface-strong)] text-[var(--brand)]' : 'text-[var(--muted)]')}><List aria-hidden="true" className="size-4" /></button>
          </div>
        </div>
        {visibleArticles.length ? (
          <div className={clsx('grid gap-4 sm:gap-5', view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
            {visibleArticles.map((article) => <ArticleCard key={article.slug} article={article} list={view === 'list'} />)}
          </div>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center text-[var(--text-secondary)]">هنوز مقاله‌ای منتشر نشده است.</p>
        )}
        {visibleCount < allArticles.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)]">نمایش مقاله‌های بیشتر</button></div>}
      </section>
    </main>
  )
}