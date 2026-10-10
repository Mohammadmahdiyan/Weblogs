import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import articlesJson from './generated/articles.json'
import type { ArticleMeta } from './lib/types'
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

function LoadingScreen() {
  return (
    <main aria-busy="true" aria-label="بارگذاری صفحه" className="mx-auto grid min-h-[55vh] w-full max-w-3xl content-start gap-4 px-4 py-12">
      <div className="h-8 w-2/5 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
      <div className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
      <div className="h-4 w-5/6 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
    </main>
  )
}

export default function App() {
  return (
    <SiteShell articles={articles}>
      <RouteEffects />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog/:slug" element={<ArticlePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteShell>
  )
}