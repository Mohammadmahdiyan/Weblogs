import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { siteCollections, type CollectionId } from './lib/collections'
import { resolveRoute } from './lib/routeResolution'
import { LoadingScreen } from './components/LoadingScreen'
import { SiteShell } from './components/SiteShell'

const homePageModule = () => import('./pages/HomePage')
const GlobalHomePage = lazy(() => homePageModule().then((module) => ({ default: module.GlobalHomePage })))
const HomePage = lazy(() => homePageModule().then((module) => ({ default: module.HomePage })))
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((module) => ({ default: module.ArticlePage })))
const HiddenArticlePage = lazy(() =>
  import('./pages/HiddenArticlePage').then((module) => ({ default: module.HiddenArticlePage })),
)
const PendingBookPage = lazy(() =>
  import('./pages/PendingBookPage').then((module) => ({ default: module.PendingBookPage })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function CategoryPage({ category }: { category: CollectionId }) {
  const location = useLocation()
  const resolution = resolveRoute(location.pathname, siteCollections)
  switch (resolution.kind) {
    case 'home':
      return <HomePage collection={category} />
    case 'directory':
      return <HomePage key={`${category}/${resolution.slug}`} collection={category} currentPath={resolution.slug} />
    case 'article':
      return <ArticlePage key={resolution.slug} collection={category} articleSlug={resolution.slug} />
    case 'bookPage':
      return (
        <ArticlePage
          key={`${resolution.slug}/${resolution.page}`}
          collection="books"
          articleSlug={resolution.slug}
          requestedPage={resolution.page}
        />
      )
    case 'bookPagePending': {
      const book = siteCollections.books.items.find((item) => item.slug === resolution.slug)
      return book ? <PendingBookPage book={book} page={resolution.page} /> : <NotFoundPage />
    }
    case 'hidden':
      return <HiddenArticlePage slug={resolution.slug} basePath={siteCollections[category].route} />
    case 'redirect':
      return <Navigate replace to={`${resolution.to}${location.search}${location.hash}`} />
    case 'notFound':
      return <NotFoundPage candidates={resolution.candidates} />
  }
}

function LegacyBlogRoute() {
  const location = useLocation()
  const resolution = resolveRoute(location.pathname, siteCollections)
  if (resolution.kind === 'notFound') return <NotFoundPage candidates={resolution.candidates} />
  if (resolution.kind === 'redirect') {
    return <Navigate replace to={`${resolution.to}${location.search}${location.hash}`} />
  }
  if (resolution.kind === 'home') return <Navigate replace to={`/media${location.search}${location.hash}`} />
  if (resolution.kind === 'directory') {
    return <Navigate replace to={`/media/${resolution.slug}${location.search}${location.hash}`} />
  }
  if (resolution.kind === 'hidden') {
    return <Navigate replace to={`/media/${resolution.slug}${location.search}${location.hash}`} />
  }
  if (resolution.kind === 'article') {
    return <Navigate replace to={`/media/${resolution.slug}${location.search}${location.hash}`} />
  }
  return <Navigate replace to={`${location.pathname.replace(/^\/blog/, '/media')}${location.search}${location.hash}`} />
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
