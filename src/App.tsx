import { lazy, Suspense, useEffect, useState } from 'react'
import articleData from './generated/articles.json'
import { articleBodies } from './generated/bodies'
import type { ArticleMeta } from './lib/types'

const articles = articleData as ArticleMeta[]
const MarkdownRenderer = lazy(() =>
  import('./components/MarkdownRenderer').then((module) => ({ default: module.MarkdownRenderer })),
)

function App() {
  const article = articles[0]
  const articleSlug = article?.slug
  const [markdown, setMarkdown] = useState<string | null>(null)

  useEffect(() => {
    if (!articleSlug) return
    let cancelled = false
    const loadBody = articleBodies[articleSlug]
    if (!loadBody) return

    void loadBody().then((module) => {
      if (!cancelled) setMarkdown(module.default)
    })

    return () => {
      cancelled = true
    }
  }, [articleSlug])

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-start text-3xl font-bold leading-tight">
          {article?.title ?? 'وبلاگ اسلامی'}
        </h1>
        {article && markdown !== null && (
          <Suspense fallback={<div aria-busy="true" className="h-24 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />}>
            <MarkdownRenderer markdown={markdown} />
          </Suspense>
        )}
      </article>
    </main>
  )
}

export default App