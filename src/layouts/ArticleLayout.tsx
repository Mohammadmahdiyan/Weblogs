import type { ReactNode } from 'react'
import { Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react'
import { clsx } from 'clsx'
import { getLayout } from './config'

export interface ArticleLayoutProps {
  style: number
  /** Article card + related articles + prev/next. */
  children: ReactNode
  sidebar: ReactNode
  /** Only used by styles whose layout has a side TOC. */
  toc?: ReactNode
}

function Reactions() {
  // Purely decorative (Medium-like). Hidden from assistive tech on purpose.
  return (
    <div aria-hidden="true" className="mt-10 flex items-center justify-between border-y border-[var(--border-light)] py-4 text-[var(--muted)]">
      <div className="flex items-center gap-6"><Heart className="size-5" /><MessageCircle className="size-5" /></div>
      <div className="flex items-center gap-6"><Bookmark className="size-5" /><Share2 className="size-5" /></div>
    </div>
  )
}

export function ArticleLayout({ style, children, sidebar, toc }: ArticleLayoutProps) {
  const config = getLayout(style)
  const main = (
    <div className="min-w-0">
      {children}
      {config.reactions && <Reactions />}
    </div>
  )

  let content: ReactNode
  if (config.columns === 'main-side') {
    content = (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-7">
        {main}
        <div className="min-w-0">{sidebar}</div>
      </div>
    )
  } else if (config.columns === 'toc-main') {
    content = (
      <div className="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-24">{toc}</div>
        <div className="grid min-w-0 gap-8">{main}<div className="min-w-0">{sidebar}</div></div>
      </div>
    )
  } else if (config.columns === 'nav-main-toc') {
    content = (
      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_14rem]">
        <div className="order-3 min-w-0 lg:sticky lg:top-24 lg:order-1">{sidebar}</div>
        <div className="order-1 min-w-0 lg:order-2">{main}</div>
        <div className="order-2 min-w-0 lg:sticky lg:top-24 lg:order-3">{toc}</div>
      </div>
    )
  } else {
    content = <div className="grid gap-8">{main}<div className="min-w-0">{sidebar}</div></div>
  }

  return (
    <div className={clsx('blog-scope', `blog-style-${config.id}`)}>
      <main id="main-content" className={clsx('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8', config.maxWidth)}>
        {content}
      </main>
    </div>
  )
}
