import { Link, useSearchParams } from 'react-router-dom'
import { Headphones, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ArticleMeta } from '../lib/types'
import { siteCollections, type CollectionId } from '../lib/collections'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'
import { ArticlePagination } from '../components/ArticlePagination'
import { ArticleSearch } from '../components/ArticleSearch'
import { FontControls } from '../components/FontControls'
import { AdultArticleNotice } from '../components/AdultArticleNotice'
import { useAdultAccess } from '../lib/adultAccess'
import { useMediaQuery } from '../lib/useMediaQuery'
import { pageSizeFor } from '../lib/pageSize'
import { NoImage } from '../components/NoImage'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { StoryButton } from '../components/Stories'
import { assetUrl } from '../lib/assetUrl'
import homePageContent from '../../content/home.json'

interface FolderCardData {
  slug: string
  title: string
  caption: string
  image: string
}

interface FolderPageData {
  title: string
  subtitle: string
  searchLabel: string
  listHeading: string
  emptyMessage: string
  folders: FolderCardData[]
}

interface HomeCardData {
  collection: CollectionId
  title: string
  caption: string
  image: string
}

interface HomePageContent {
  title: string
  subtitle: string
  searchLabel: string
  emptyMessage: string
  listHeading: string
  items: HomeCardData[]
}

const homeContent = homePageContent as HomePageContent
const folderPageConfigs = import.meta.glob<{ default: FolderPageData }>('../../content/folder-pages/**/*.json', {
  eager: true,
})
const globalArticles = Object.values(siteCollections).flatMap((collection) =>
  collection.items.map((article) => ({
    ...article,
    slug: `${collection.route.slice(1)}/${article.slug}`,
  })),
)
const globalSearchIndex = Object.values(siteCollections).flatMap((collection) =>
  collection.searchIndex.map((entry) => ({
    ...entry,
    slug: `${collection.route.slice(1)}/${entry.slug}`,
  })),
)

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(`${date}T12:00:00`))
}

function folderLabel(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function ArticleCover({ article }: { article: ArticleMeta }) {
  if (article.cover?.type === 'image') {
    return (
      <ImageWithFallback
        src={article.cover.url}
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
    )
  }
  if (article.cover?.type === 'video') {
    return (
      <div className="relative flex aspect-video items-center justify-center bg-[var(--surface-strong)] text-[var(--text-muted)]">
        <Play aria-hidden="true" className="size-9" />
        <span className="sr-only">ویدیو</span>
      </div>
    )
  }
  if (article.cover?.type === 'embed') {
    return article.cover.poster ? (
      <div className="relative">
        <ImageWithFallback
          src={article.cover.poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-video w-full object-cover"
        />
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/60 text-white">
            <Play className="size-5" />
          </span>
        </span>
        <span className="sr-only">ویدیو</span>
      </div>
    ) : (
      <div className="relative flex aspect-video items-center justify-center bg-[var(--surface-strong)] text-[var(--text-muted)]">
        <Play aria-hidden="true" className="size-9" />
        <span className="sr-only">محتوای جاسازی‌شده</span>
      </div>
    )
  }
  if (article.cover?.type === 'audio') {
    return (
      <div className="flex aspect-video items-center justify-center bg-[var(--surface-alt)] text-[var(--brand)]">
        <Headphones aria-hidden="true" className="size-9" />
        <span className="sr-only">صوت</span>
      </div>
    )
  }
  return <NoImage />
}

function ListingCard({
  href,
  title,
  description,
  cover,
  children,
  ariaLabel,
}: {
  href: string
  title: ReactNode
  description: ReactNode
  cover: ReactNode
  children?: ReactNode
  ariaLabel?: string
}) {
  return (
    <article className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <Link to={href} aria-label={ariaLabel} className="relative block overflow-hidden bg-[var(--surface-alt)]">
        {cover}
      </Link>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <h2 className="mb-2 text-start text-lg leading-8 font-bold">
          <Link to={href} className="text-[var(--text)] no-underline hover:text-[var(--brand)]">
            {title}
          </Link>
        </h2>
        <p className="mb-4 line-clamp-3 text-start text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
        {children}
      </div>
    </article>
  )
}

function ArticleCard({
  article,
  adultConfirmed,
  route,
}: {
  article: ArticleMeta
  adultConfirmed: boolean
  route: string
}) {
  const censored = article.adult === true && !adultConfirmed
  return (
    <ListingCard
      href={`${route}/${article.slug}`}
      ariaLabel={censored ? 'مشاهده مقاله +۱۸' : `خواندن ${article.title}`}
      title={
        censored ? (
          <span className="relative block">
            <span className="block blur-sm select-none">{article.title}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <AdultArticleNotice compact />
            </span>
          </span>
        ) : (
          article.title
        )
      }
      description={
        censored ? (
          <span className="relative block">
            <span className="block blur-sm select-none">{article.description}</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded bg-[var(--surface)]/90 px-2 py-1 text-xs font-semibold">حاوی جملات +۱۸</span>
            </span>
          </span>
        ) : (
          article.description
        )
      }
      cover={
        censored ? (
          <div className="relative aspect-video overflow-hidden">
            <div className="pointer-events-none scale-110 blur-xl" aria-hidden="true">
              <ArticleCover article={article} />
            </div>
            <div className="absolute inset-0 grid place-items-center bg-[var(--surface)]/75">
              <AdultArticleNotice compact />
            </div>
          </div>
        ) : (
          <ArticleCover article={article} />
        )
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
        <time dateTime={article.date}>{formatDate(article.date)}</time>
        {!censored && <span>{article.readingTime} دقیقه مطالعه</span>}
      </div>
      {!censored && (
        <ul className="mt-4 flex flex-wrap gap-2 p-0">
          {article.tags.map((tag) => (
            <li
              key={tag}
              className="list-none rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </ListingCard>
  )
}

/** The home page (blog list) and, with `collection="books"`, the books page: same search, same list, same pages. */
export function HomePage({
  collection = 'media',
  currentPath = '',
}: {
  collection?: CollectionId
  currentPath?: string
}) {
  const { items: categoryArticles, searchIndex, route, text } = siteCollections[collection]
  const prefix = currentPath.replace(/^\/+|\/+$/g, '')
  const folderPageKey = `../../content/folder-pages/${collection}/${prefix || '_root'}.json`
  const folderPage = (folderPageConfigs[folderPageKey] as { default: FolderPageData } | undefined)?.default
  const searchArticles = categoryArticles.filter((article) => !prefix || article.slug.startsWith(`${prefix}/`))
  const searchSlugs = new Set(searchArticles.map((article) => article.slug))
  const scopedSearchIndex = searchIndex.filter((entry) =>
    [...searchSlugs].some((slug) => entry.slug === slug || entry.slug.startsWith(`${slug}/`)),
  )
  const allArticles = categoryArticles.filter((article) => {
    const separator = article.slug.lastIndexOf('/')
    return (separator < 0 ? '' : article.slug.slice(0, separator)) === prefix
  })
  const childFolders = [
    ...new Set(
      categoryArticles
        .map((article) =>
          article.slug.startsWith(prefix ? `${prefix}/` : '')
            ? article.slug.slice(prefix ? prefix.length + 1 : 0).split('/')[0]
            : '',
        )
        .filter(
          (child) => child && !allArticles.some((article) => article.slug === (prefix ? `${prefix}/${child}` : child)),
        ),
    ),
  ]
  const isBooks = collection === 'books'
  const [searchParams, setSearchParams] = useSearchParams()
  const adultConfirmed = useAdultAccess()
  const pageTitle =
    folderPage?.title ||
    (prefix
      ? (siteCollections[collection].folderNames[prefix] ?? folderLabel(prefix.split('/').at(-1)!))
      : text.pageTitle)
  const pageDescription = folderPage?.subtitle || text.pageDescription
  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.siteUrl}${route}/${prefix}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  })
  const wide = useMediaQuery('(min-width: 1024px)')
  const medium = useMediaQuery('(min-width: 640px)')
  const pageSize = pageSizeFor(wide, medium)
  // The page number lives in `?page=` so Back works and a page can be shared; changing it does not reload anything.
  const pageCount = Math.max(1, Math.ceil(allArticles.length / pageSize))
  const currentPage = Math.min(pageCount, Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1))
  const visibleArticles = allArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function goToPage(page: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (page <= 1) next.delete('page')
      else next.set('page', String(page))
      return next
    })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() =>
      document
        .getElementById('articles')
        ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }),
    )
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 text-center sm:mb-14">
        <h1 className="mb-3 text-3xl leading-tight font-extrabold sm:text-4xl">{pageTitle}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          {pageDescription}
        </p>
        {/* key: switching between blog and books starts a fresh search box */}
        <ArticleSearch
          key={`${collection}/${prefix}`}
          articles={searchArticles}
          searchIndex={scopedSearchIndex}
          initialQuery={searchParams.get('q') ?? ''}
          basePath={route}
          bookMode={isBooks}
          label={folderPage?.searchLabel || text.searchLabel}
          placeholder={
            folderPage ? folderPage.searchLabel || 'عنوان را جست‌وجو کنید؛ برای متن: محتوا::عبارت' : undefined
          }
        />
        <div className="mt-5 flex justify-center">
          <div className="flex items-center gap-4">
            <FontControls />
            <StoryButton data={siteCollections[collection].story} />
          </div>
        </div>
      </section>

      <section id="articles" aria-labelledby="articles-heading">
        <div className="mb-5">
          <h2 id="articles-heading" className="m-0 text-start text-xl font-bold">
            {folderPage?.listHeading || text.listHeading}
          </h2>
        </div>
        {childFolders.length > 0 || visibleArticles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {childFolders.map((folder) => {
              const childPath = prefix ? `${prefix}/${folder}` : folder
              const href = `${route}/${childPath}`
              const folderData = folderPage?.folders.find((item) => item.slug === folder)
              const title =
                folderData?.title || siteCollections[collection].folderNames[childPath] || folderLabel(folder)
              const fallbackArticle = categoryArticles.find(
                (article) => article.slug.startsWith(`${childPath}/`) && article.cover,
              )
              return (
                <ListingCard
                  key={childPath}
                  href={href}
                  title={title}
                  description={folderData?.caption || 'برای مشاهدهٔ محتوا، این بخش را انتخاب کنید.'}
                  ariaLabel={title}
                  cover={
                    folderData?.image ? (
                      <ImageWithFallback
                        src={assetUrl(folderData.image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-video w-full object-cover"
                      />
                    ) : fallbackArticle ? (
                      <ArticleCover article={fallbackArticle} />
                    ) : (
                      <NoImage />
                    )
                  }
                >
                  <span className="text-xs text-[var(--muted)]">مشاهدهٔ بخش</span>
                </ListingCard>
              )
            })}
            {visibleArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} adultConfirmed={adultConfirmed} route={route} />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center text-[var(--text-secondary)]">
            {folderPage?.emptyMessage || text.empty}
          </p>
        )}
        <ArticlePagination pageCount={pageCount} current={currentPage} onChange={goToPage} />
      </section>
    </main>
  )
}

export function GlobalHomePage() {
  usePageMeta({ title: homeContent.title, description: homeContent.subtitle })
  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 text-center sm:mb-14">
        <h1 className="mb-3 text-3xl leading-tight font-extrabold sm:text-4xl">{homeContent.title}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          {homeContent.subtitle}
        </p>
        <ArticleSearch
          articles={globalArticles}
          searchIndex={globalSearchIndex}
          basePath=""
          label={homeContent.searchLabel}
        />
        <div className="mt-5 flex justify-center">
          <div className="flex items-center gap-4">
            <FontControls />
            <StoryButton />
          </div>
        </div>
      </section>

      <section aria-labelledby="home-sections-heading">
        <div className="mb-5">
          <h2 id="home-sections-heading" className="m-0 text-start text-xl font-bold">
            {homeContent.listHeading}
          </h2>
        </div>
        {homeContent.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {homeContent.items.map((item) => {
              const route = siteCollections[item.collection].route
              return (
                <ListingCard
                  key={item.collection}
                  href={route}
                  title={item.title}
                  description={item.caption}
                  ariaLabel={item.title}
                  cover={
                    <ImageWithFallback
                      src={assetUrl(item.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover"
                    />
                  }
                ></ListingCard>
              )
            })}
          </div>
        ) : (
          <p
            role="status"
            className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center text-[var(--text-secondary)]"
          >
            {homeContent.emptyMessage}
          </p>
        )}
      </section>
    </main>
  )
}
