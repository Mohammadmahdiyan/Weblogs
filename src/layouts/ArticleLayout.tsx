import type { ReactNode } from 'react'

export interface ArticleLayoutProps {
  /** Article card + related articles + prev/next. */
  children: ReactNode
  sidebar: ReactNode
}

/**
 * The one page layout every article uses: article on the main side, sidebar next to it.
 * Readers cannot switch the whole layout; they only adjust small things (palette, accordion,
 * quote and button looks) from the «ظاهر» menu — see `src/lib/appearance.ts`.
 */
export function ArticleLayout({ children, sidebar }: ArticleLayoutProps) {
  return (
    <div className="blog-scope">
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-7">
          <div className="min-w-0">{children}</div>
          <div className="min-w-0">{sidebar}</div>
        </div>
      </main>
    </div>
  )
}
