import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { siteCollections, type CollectionId } from './lib/collections'
import { LoadingScreen } from './components/LoadingScreen'
import { SiteShell } from './components/SiteShell'

const homePageModule = () => import('./pages/HomePage')
const GlobalHomePage = lazy(() => homePageModule().then((module) => ({ default: module.GlobalHomePage })))
const HomePage = lazy(() => homePageModule().then((module) => ({ default: module.HomePage })))
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((module) => ({ default: module.ArticlePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function CategoryPage({ category }: { category: CollectionId }) {
  const location = useLocation()
  const route = siteCollections[category].route
  const rawSlug = location.pathname
    .slice(route.length)
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => {
      try {
        return decodeURIComponent(part)
      } catch {
        return part
      }
    })
    .join('/')
  const slug = rawSlug.replace(/\/+$/, '')
  const items = siteCollections[category].items
  const exact = items.find((item) => item.slug === slug)
  if (exact) return <ArticlePage key={slug} collection={category} articleSlug={slug} />
  if (category === 'books') {
    const match = slug.match(/^(.*)\/(\d+)$/)
    if (match) {
      const article = items.find(
        (item) => item.slug === match[1] && item.pages?.some((page) => page.number === Number(match[2])),
      )
      if (article)
        return <ArticlePage key={slug} collection={category} articleSlug={article.slug} requestedPage={match[2]} />
    }
  }
  return <HomePage key={`${category}/${slug}`} collection={category} currentPath={slug} />
}

function LegacyBlogRoute() {
  const location = useLocation()
  const oldSlug = location.pathname.replace(/^\/blog\/?/, '').replace(/\/+$/, '')
  const item =
    siteCollections.media.items.find((candidate) => candidate.slug === oldSlug) ??
    siteCollections.media.items.find((candidate) => candidate.slug.split('/').at(-1) === oldSlug)
  const destination = item ? `${siteCollections.media.route}/${item.slug}` : siteCollections.media.route
  return <Navigate replace to={`${destination}${location.search}${location.hash}`} />
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <SiteShell articles={siteCollections.media.items}>
      <RouteEffects />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<GlobalHomePage />} />
          <Route path="/blog" element={<LegacyBlogRoute />} />
          <Route path="/blog/*" element={<LegacyBlogRoute />} />
          <Route path="/books/*" element={<CategoryPage category="books" />} />
          <Route path="/media/*" element={<CategoryPage category="media" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteShell>
  )
}
