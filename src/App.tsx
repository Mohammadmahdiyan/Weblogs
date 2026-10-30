import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import articlesJson from './generated/articles.json'
import type { ArticleMeta } from './lib/types'
import { LoadingScreen } from './components/LoadingScreen'
import { SiteShell } from './components/SiteShell'

const articles = articlesJson as ArticleMeta[]
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((module) => ({ default: module.ArticlePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <SiteShell articles={articles}>
      <RouteEffects />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomePage key="blog" />} />
          <Route path="/blog/:slug" element={<ArticlePage key="blog" />} />
          <Route path="/books" element={<HomePage key="books" collection="books" />} />
          <Route path="/books/:slug" element={<ArticlePage key="books" collection="books" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteShell>
  )
}