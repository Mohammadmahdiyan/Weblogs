import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChevronLeft, ShieldAlert } from 'lucide-react'
import type { ArticleMeta } from '../lib/types'
import { siteCollections, type CollectionId, type SiteCollection } from '../lib/collections'
import { buildToc } from '../lib/toc'
import { FIND_INDEX_PARAM, FIND_PARAM, parseOccurrence } from '../lib/contentSearch'
import { useFindInPage } from '../lib/findInPage'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'
import { ArticleSidebar } from '../components/ArticleSidebar'
import { ArticleToc } from '../components/ArticleToc'
import { CoverMedia } from '../components/CoverMedia'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { ArticleLayout } from '../layouts'
import { Basmala } from '../components/Basmala'
import { IncompleteNotice } from '../components/IncompleteNotice'
import { TelegramCopy } from '../components/TelegramCopy'
import { HiddenArticlePage } from './HiddenArticlePage'
import { NotFoundPage } from './NotFoundPage'
import { confirmAdultAccess, useAdultAccess } from '../lib/adultAccess'


function AdultContentGate({ onYes }: { onYes: () => void }) {
  return (
    <main
      dir="rtl"
      lang="fa"
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-[var(--bg)] px-4 py-8 text-[var(--text)]"
    >
      <section className="surface-card w-full max-w-lg p-6 text-center sm:p-9">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[var(--surface-alt)]">
          <ShieldAlert aria-hidden="true" className="size-9 text-[var(--brand)]" />
        </div>

        <p className="mb-3 text-sm font-bold text-[var(--brand)]">هشدار محتوای +۱۸</p>
        <h1 className="mb-4 text-2xl font-extrabold">
          این مقاله برای افراد زیر ۱۸ سال مناسب نیست
        </h1>
        <p className="text-sm leading-8 text-[var(--text-secondary)]">
          اگر زیر ۱۸ سال هستید، لطفاً «خیر» را انتخاب کنید تا به صفحهٔ اصلی برگردید.
          با انتخاب «بله» تأیید می‌کنید که ۱۸ سال یا بیشتر دارید.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onYes}
            className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-[var(--brand-contrast)] transition-opacity hover:opacity-90"
          >
            بله، ۱۸ سال یا بیشتر دارم
          </button>
          <Link
            to="/"
            className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] px-5 py-3 font-semibold text-[var(--text)] no-underline transition-colors hover:bg-[var(--surface-strong)]"
          >
            خیر، بازگشت به خانه
          </Link>
        </div>

        <p className="mt-5 text-xs text-[var(--muted)]">
          انتخاب شما در این مرورگر ذخیره می‌شود. این تأیید، سن واقعی را احراز نمی‌کند.
        </p>
      </section>
    </main>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(`${date}T12:00:00`))
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"><div className="h-full bg-[var(--brand-bright)] transition-[width]" style={{ width: `${progress}%` }} /></div>
}

function RelatedArticles({ article, collection }: { article: ArticleMeta; collection: SiteCollection }) {
  const adultConfirmed = useAdultAccess()
  const related = collection.items
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({ article: item, score: item.tags.filter((tag) => article.tags.includes(tag)).length }))
    .sort((first, second) => second.score - first.score || second.article.date.localeCompare(first.article.date))
  const shared = related.some((item) => item.score > 0)
  const items = (shared ? related.filter((item) => item.score > 0) : related).slice(0, 4).map((item) => item.article)
  if (!items.length) return null

  return (
    <section aria-labelledby="related-heading" className="surface-card mt-6 p-5 sm:p-7">
      <h2 id="related-heading" className="mb-4 flex items-center gap-2 text-start text-lg font-bold"><BookOpen aria-hidden="true" className="size-5 text-[var(--brand)]" />{collection.text.related}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => <Link key={item.slug} to={`${collection.route}/${item.slug}`} className="line-clamp-2 rounded-[var(--radius-sm)] border border-transparent bg-[var(--surface-alt)] p-4 text-start text-sm leading-6 text-[var(--text)] no-underline hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]">{item.adult && !adultConfirmed ? 'مقالهٔ +۱۸ — محتوای محدودشده' : item.title}</Link>)}
      </div>
    </section>
  )
}

/** One item page: an article (`/blog/:slug`) or, with `collection="books"`, a book (`/books/:slug`). */
export function ArticlePage({ collection: collectionId = 'blog' }: { collection?: CollectionId }) {
  const collection = siteCollections[collectionId]
  const { items: articles, bodies: articleBodies, route } = collection
  const { slug = '' } = useParams()
  const article = articles.find((item) => item.slug === slug)
  const adultConfirmed = useAdultAccess()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [bodyState, setBodyState] = useState<{ slug: string; markdown?: string; error?: boolean } | null>(null)
  const markdown = bodyState?.slug === slug ? bodyState.markdown ?? null : null
  const bodyError = (bodyState?.slug === slug && bodyState.error === true) || Boolean(article && !articleBodies[article.slug])
  const toc = useMemo(() => buildToc(markdown ?? ''), [markdown])
  const [searchParams] = useSearchParams()
  // Set by a content search on the home page: scroll to this text and highlight it.
  useFindInPage(searchParams.get(FIND_PARAM), markdown !== null, parseOccurrence(searchParams.get(FIND_INDEX_PARAM)))
  const articleIndex = articles.findIndex((item) => item.slug === slug)

  const pageUrl = `${siteConfig.siteUrl}${route}/${slug}`
  const imageUrl = article?.cover?.type === 'image'
    ? article.cover.url
    : article?.cover?.type === 'embed' ? article.cover.poster : undefined
  const jsonLd = useMemo(() => {
    if (!article) return undefined
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.date,
        dateModified: article.updated,
        mainEntityOfPage: pageUrl,
        ...(imageUrl ? { image: new URL(imageUrl, siteConfig.siteUrl).toString() } : {}),
        publisher: { '@type': 'Organization', name: siteConfig.siteName },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'خانه', item: siteConfig.siteUrl },
          ...(collectionId === 'books' ? [{ '@type': 'ListItem', position: 2, name: collection.text.breadcrumb, item: `${siteConfig.siteUrl}/books` }] : []),
          { '@type': 'ListItem', position: collectionId === 'books' ? 3 : 2, name: article.title, item: pageUrl },
        ],
      },
    ]
  }, [article, collection, collectionId, imageUrl, pageUrl])

  usePageMeta({
    title: article?.title ?? collection.text.notFoundTitle,
    description: article?.description ?? (collectionId === 'books' ? 'کتاب درخواستی پیدا نشد.' : 'مقاله‌ی درخواستی پیدا نشد.'),
    image: imageUrl,
    type: 'article',
    jsonLd,
  })

  useEffect(() => {
    if (!article || (article.adult === true && !adultConfirmed)) return
    let cancelled = false
    const loadBody = articleBodies[article.slug]
    if (!loadBody) return
    void loadBody().then((body) => {
      if (!cancelled) setBodyState({ slug: article.slug, markdown: body.default })
    }, () => {
      if (!cancelled) setBodyState({ slug: article.slug, error: true })
    })
    return () => { cancelled = true }
  }, [article, adultConfirmed, articleBodies])

  if (!article) return collection.hidden.includes(slug) ? <HiddenArticlePage slug={slug} basePath={route} /> : <NotFoundPage />

  if (article.adult === true && !adultConfirmed) {
    return (
      <AdultContentGate
        onYes={confirmAdultAccess}
      />
    )
  }

  const previous = articleIndex > 0 ? articles[articleIndex - 1] : undefined
  const next = articleIndex >= 0 ? articles[articleIndex + 1] : undefined
  const tocReady = markdown !== null && toc.length > 0

  return (
    <>
      <ReadingProgress />
      <ArticleLayout sidebar={<ArticleSidebar articles={articles} article={article} collection={collection} />}>
        <article className="article-card text-[var(--text)]">
          <nav aria-label="مسیر صفحه" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[var(--muted)]">
            <Link to="/" className="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]">خانه</Link>
            <ChevronLeft aria-hidden="true" className="size-3 ltr:rotate-180" />
            <Link to={collectionId === 'books' ? '/books' : '/#articles'} className="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]">{collection.text.breadcrumb}</Link>
            <ChevronLeft aria-hidden="true" className="size-3 ltr:rotate-180" />
            <span aria-current="page" className="max-w-full truncate">{article.title}</span>
          </nav>

          <h1 className="article-title mb-5">{article.title}</h1>
          <div className="article-meta mb-6 grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-3 border-b border-[var(--border-light)] pb-5 text-start sm:gap-8">
            <MetaValue label="تاریخ انتشار" value={formatDate(article.date)} />
            {article.updated !== article.date && <MetaValue label="به‌روزرسانی" value={formatDate(article.updated)} />}
            <MetaValue label="زمان مطالعه" value={`${article.readingTime} دقیقه`} />
          </div>

          <div className="article-cover"><CoverMedia cover={article.cover} title={article.title} /></div>

          <Basmala />

          {tocReady && <ArticleToc items={toc} variant="box" />}

          <div ref={bodyRef} className="article-lang" lang={article.lang} dir={article.dir}>
            {bodyError && <p role="alert" className="text-[var(--danger)]">بارگذاری متن مقاله ممکن نشد.</p>}
            {markdown === null && !bodyError && <div aria-busy="true" className="my-6 grid gap-4"><div className="h-6 w-2/5 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /><div className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /><div className="h-4 w-5/6 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /></div>}
            {markdown !== null && <MarkdownRenderer markdown={markdown} className="[&_h2]:scroll-mt-24" />}
          </div>

          {markdown !== null && <TelegramCopy markdown={markdown} bodyRef={bodyRef} />}

          {article.incomplete && markdown !== null && <IncompleteNotice title={article.title} />}

          {article.suggestions.length > 0 && <section aria-labelledby="questions-heading" className="mt-8 border-t border-[var(--border-light)] pt-5">
            <h2 id="questions-heading" className="mb-3 text-start text-base font-bold">پرسش‌های مرتبط</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {article.suggestions.map((suggestion) => <li key={suggestion} className="rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-3 py-2 text-start text-sm text-[var(--text-secondary)]">{suggestion}</li>)}
            </ul>
          </section>}

          {article.tags.length > 0 && <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border-light)] pt-5">
            <span className="text-sm font-semibold">برچسب‌ها:</span>
            {article.tags.map((tag) => <span key={tag} className="article-tag px-2.5 py-1 text-xs transition-colors">{tag}</span>)}
          </div>}
        </article>

        <RelatedArticles article={article} collection={collection} />
        <nav aria-label="پیمایش مقاله‌ها" className="mt-4 grid gap-3 sm:grid-cols-2">
          {previous ? <ArticleNavItem article={previous} direction="previous" collection={collection} /> : <span />}
          {next ? <ArticleNavItem article={next} direction="next" collection={collection} /> : <span />}
        </nav>
      </ArticleLayout>
    </>
  )
}

function MetaValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><span className="mb-1 block text-[10px] text-[var(--muted)] sm:text-xs">{label}</span><span className="block truncate text-xs text-[var(--text)] sm:text-sm">{value}</span></div>
}

function ArticleNavItem({ article, direction, collection }: { article: ArticleMeta; direction: 'previous' | 'next'; collection: SiteCollection }) {
  // The list is sorted newest → oldest, so "previous" is the newer article.
  const label = direction === 'previous' ? collection.text.newer : collection.text.older
  const adultConfirmed = useAdultAccess()
  return (
    <Link to={`${collection.route}/${article.slug}`} className="surface-card flex min-w-0 items-center gap-3 p-4 text-start no-underline hover:border-[var(--brand)]">
      {direction === 'previous' && <ArrowLeft aria-hidden="true" className="size-4 shrink-0 text-[var(--brand)] rtl:rotate-180" />}
      <span className="min-w-0 flex-1"><span className="block text-xs text-[var(--muted)]">{label}</span><span className="mt-1 line-clamp-2 block text-sm font-semibold text-[var(--text)]">{article.adult && !adultConfirmed ? 'مقالهٔ +۱۸ — محتوای محدودشده' : article.title}</span></span>
      {direction === 'next' && <ArrowLeft aria-hidden="true" className="size-4 shrink-0 text-[var(--brand)] rotate-180 rtl:rotate-0" />}
    </Link>
  )
}
