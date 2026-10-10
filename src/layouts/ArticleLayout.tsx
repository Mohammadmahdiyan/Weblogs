import type { ReactNode } from 'react'

export interface ArticleLayoutProps {
  style: number
  children: ReactNode
  sidebar: ReactNode
}

export function ArticleLayout({ style, children, sidebar }: ArticleLayoutProps) {
  const activeStyle = Number.isInteger(style) && style >= 1 && style <= 8 ? style : 1
  return (
    <div className={`blog-style-${activeStyle}`}>
      <main>
        <div className="mx-auto grid w-full max-w-7xl items-start gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-7">
          <div className="min-w-0">{children}</div>
          <div className="min-w-0">{sidebar}</div>
        </div>
      </main>
    </div>
  )
}