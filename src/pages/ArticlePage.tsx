import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import GithubSlugger from 'github-slugger'
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft } from 'lucide-react'
import articlesJson from '../generated/articles.json'
import { articleBodies } from '../generated/bodies'
import type { ArticleMeta } from '../lib/types'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'
import { CoverMedia } from '../components/CoverMedia'
import { ArticleSidebar } from '../components/ArticleSidebar'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { StylePreviewToggle } from '../components/ThemeControls'
import { ArticleLayout } from '../layouts'

const articles = [...articlesJson as ArticleMeta[]].sort((first, second) => second.date.localeCompare(first.date))

interface TocItem { level: number; title: string; id: string }

function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headings: TocItem[] = []
  const expression = /^ {0,3}(#{2,3})\s+(.+?)\s*#*\s*$/gm
  for (const match of markdown.matchAll(expression)) {
    const title = match[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim()
    headings.push({ level: match[1].length, title, id: slugger.slug(title) })
  }
  return headings
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
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"><div className="h-full bg-[var(--brand)] transition-[width]" style={{ width: `${progress}%` }} /></div>
}

function ArticleToc({ items }: { items: TocItem[] }) {
  if (!items.length) return null
  return (
    <details open className="my-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 bg-[var(--surface-alt)] px-4 py-3 text-start text-sm font-bold text-[var(--text)]">
        <BookOpen aria-hidden="true" className="size-4 text-[var(--brand)]" />
        نگاه کلی به مطالب
      </summary>
      <nav aria-label="فهرست مطلب" className="px-4 py-3">
        <ul className="m-0 grid list-none gap-2 p-0">
          {items.map((item) => (
            <li key={item.id} className={item.level === 3 ? 'ps-5' : ''}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-3 text-start text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]"
              >
                {item.level === 3 ? (
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--info)]" />
                ) : (
                  <BookOpen aria-hidden="true" className="size-3 shrink-0 text-[var(--brand)]" />
                )}
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  )
}

function RelatedArticles({ article }: { article: ArticleMeta }) {
  const related = articles
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({ article: item, score: item.tags.filter((tag) => article.tags.includes(tag)).length }))
    .sort((first, second) => second.score - first.score || second.article.date.localeCompare(first.article.date))
  const shared = related.some((item) => item.score > 0)
  const items = (shared ? related.filter((item) => item.score > 0) : related).slice(0, 4).map((item) => item.article)
  if (!items.length) return null

  return (
    <section className="mt-6 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-5 sm:p-7">
      <h2 className="mb-4 flex items-center gap-2 text-start text-lg font-bold"><BookOpen aria-hidden="true" className="size-5 text-[var(--brand)]" />مقالات مرتبط</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => <Link key={item.slug} to={`/blog/${item.slug}`} className="line-clamp-2 rounded-[var(--radius-sm)] bg-[var(--surface-alt)] p-4 text-start text-sm leading-6 text-[var(--text)] no-underline hover:border hover:border-[var(--border-strong)]">{item.title}</Link>)}
      </div>
    </section>
  )
}

export function ArticlePage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const article = articles.find((item) => item.slug === slug)
  const requestedStyle = Number(new URLSearchParams(location.search).get('style'))
  const activeStyle = Number.isInteger(requestedStyle) && requestedStyle >= 1 && requestedStyle <= 8
    ? requestedStyle
    : article?.style || siteConfig.defaultStyle
  const [bodyState, setBodyState] = useState<{ slug: string; markdown?: string; error?: boolean } | null>(null)
  const markdown = bodyState?.slug === slug ? bodyState.markdown ?? null : null
  const bodyError = (bodyState?.slug === slug && bodyState.error === true) || Boolean(article && !articleBodies[article.slug])
  const toc = useMemo(() => buildToc(markdown ?? ''), [markdown])
  const articleIndex = articles.findIndex((item) => item.slug === slug)

  usePageMeta({
    title: article?.title ?? 'مقاله پیدا نشد',
    description: article?.description ?? 'مقاله‌ی درخواستی پیدا نشد.',
    image: article?.cover?.type === 'image' ? article.cover.url : undefined,
    canonical: article ? `${siteConfig.siteUrl}/blog/${article.slug}` : undefined,
    article: article
      ? { date: article.date, updated: article.updated, tags: article.tags, authors: [siteConfig.siteName] }
      : undefined,
  })

  useEffect(() => {
    if (!article) return
    let cancelled = false
    const loadBody = articleBodies[article.slug]
    if (!loadBody) return
    void loadBody().then((body) => {
      if (!cancelled) setBodyState({ slug: article.slug, markdown: body.default })
    }, () => {
      if (!cancelled) setBodyState({ slug: article.slug, error: true })
    })
    return () => { cancelled = true }
  }, [article])

  if (!article) return <NotFoundArticle />

  const previous = articleIndex > 0 ? articles[articleIndex - 1] : undefined
  const next = articleIndex >= 0 ? articles[articleIndex + 1] : undefined

  return (
    <>
      <ReadingProgress />
      <ArticleLayout style={activeStyle} sidebar={<ArticleSidebar articles={articles} article={article} />}>
        <article
          lang={article.lang}
          dir={article.dir ?? 'rtl'}
          className="blog-content rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-[var(--shadow-card)] sm:p-7 prose-headings:text-start prose-p:text-start"
        >
          <CoverMedia cover={article.cover} title={article.title} />
          <nav aria-label="مسیر صفحه" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[var(--muted)]">
            <Link to="/" className="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]">خانه</Link>
            <ChevronLeft aria-hidden="true" className="size-3" />
            <Link to="/#articles" className="text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]">همه مقاله‌ها</Link>
            <ChevronLeft aria-hidden="true" className="size-3" />
            <span aria-current="page" className="max-w-full truncate">{article.title}</span>
          </nav>

          <h1 className="mb-5 border-b border-[var(--border-light)] pb-5 text-start text-3xl font-extrabold leading-tight sm:text-4xl">{article.title}</h1>
          <div className="mb-6 grid grid-cols-3 gap-3 border-b border-[var(--border-light)] pb-5 text-start sm:gap-8">
            <MetaValue label="تاریخ انتشار" value={formatDate(article.date)} />
            {article.updated && <MetaValue label="به‌روزرسانی" value={formatDate(article.updated)} />}
            <MetaValue label="زمان مطالعه" value={`${article.readingTime} دقیقه`} />
          </div>

          {markdown !== null && <ArticleToc items={toc} />}
          {bodyError && <p role="alert" className="text-[var(--danger)]">بارگذاری متن مقاله ممکن نشد.</p>}
          {markdown === null && !bodyError && <div aria-busy="true" className="my-6 grid gap-4"><div className="h-6 w-2/5 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /><div className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /><div className="h-4 w-5/6 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" /></div>}
          {markdown !== null && <MarkdownRenderer markdown={markdown} className="[&_h2]:scroll-mt-20" />}

          {article.suggestions.length > 0 && <section className="mt-8 border-t border-[var(--border-light)] pt-5">
            <h2 className="mb-3 text-start text-base font-bold">پرسش‌های مرتبط</h2>
            <ul className="flex flex-wrap gap-2 p-0">
              {article.suggestions.map((suggestion) => (
                <li key={suggestion} className="list-none rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-3 py-2 text-start text-sm text-[var(--text-secondary)]">
                  {suggestion}
                </li>
              ))}
            </ul>
          </section>}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border-light)] pt-5">
            <span className="text-sm font-semibold">برچسب‌ها:</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand)] hover:text-[var(--brand-contrast)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </article>

        <RelatedArticles article={article} />
        <nav aria-label="پیمایش مقاله‌ها" className="mt-4 grid gap-3 sm:grid-cols-2">
          {previous ? <ArticleNavItem article={previous} direction="previous" /> : <span />}
          {next ? <ArticleNavItem article={next} direction="next" /> : <span />}
        </nav>
        <StylePreviewToggle activeStyle={activeStyle} />
      </ArticleLayout>
    </>
  )
}



function MetaValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><span className="mb-1 block text-[10px] text-[var(--muted)] sm:text-xs">{label}</span><span className="block truncate text-xs text-[var(--text)] sm:text-sm">{value}</span></div>
}

function ArticleNavItem({ article, direction }: { article: ArticleMeta; direction: 'previous' | 'next' }) {
  const Icon = direction === 'previous' ? ArrowRight : ArrowLeft
  const label = direction === 'previous' ? 'مقاله پیشین' : 'مقاله بعدی'
  return (
    <Link to={`/blog/${article.slug}`} className="flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-4 text-start no-underline hover:border-[var(--brand)]">
      {direction === 'previous' && <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--brand)]" />}
      <span className="min-w-0 flex-1"><span className="block text-xs text-[var(--muted)]">{label}</span><span className="mt-1 line-clamp-2 block text-sm font-semibold text-[var(--text)]">{article.title}</span></span>
      {direction === 'next' && <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--brand)]" />}
    </Link>
  )
}

function NotFoundArticle() {
  return <main className="px-4 py-16 text-center"><h1 className="text-2xl font-bold">مقاله پیدا نشد</h1><Link to="/" className="text-[var(--info)]">بازگشت به خانه</Link></main>
}