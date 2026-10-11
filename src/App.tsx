import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import articlesJson from './generated/articles.json'
import type { ArticleMeta } from './lib/types'
import { SiteShell } from './components/SiteShell'
import { LoadingScreen } from './components/LoadingScreen'
import { ErrorBoundary } from './components/ErrorBoundary'

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

function PageErrorFallback() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-2xl font-bold text-[var(--text)]">خطا در بارگذاری صفحه</h1>
      <p className="mb-6 text-[var(--text-secondary)]">مشکلی در نمایش این صفحه به وجود آمده است.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-[var(--info)] focus-visible:outline-offset-2"
      >
        بازنشانی صفحه
      </button>
    </main>
  )
}

export default function App() {
  return (
    <SiteShell articles={articles}>
      <RouteEffects />
      <ErrorBoundary fallback={<PageErrorFallback />}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </SiteShell>
  )
}