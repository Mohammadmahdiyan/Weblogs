import type { ReactNode } from 'react'

export interface ArticleLayoutProps {
  style: number
  children: ReactNode
  sidebar: ReactNode
}

export function ArticleLayout({ style, children, sidebar }: ArticleLayoutProps) {
  const activeStyle = Number.isInteger(style) && style >= 1 && style <= 8 ? style : 1
  const styleClass = `blog-style-${activeStyle}`

  if (activeStyle === 2) {
    return (
      <div className={styleClass}>
        <main className="mx-auto px-4 py-12">
          <div className="mx-auto max-w-[680px] space-y-6">
            {children}
          </div>
        </main>
        <aside className="mx-auto max-w-[680px] px-4 py-8">
          {sidebar}
        </aside>
      </div>
    )
  }

  if (activeStyle === 4) {
    return (
      <div className={styleClass}>
        <main className="mx-auto flex max-w-7xl flex-row gap-6 px-4 py-8">
          <aside className="hidden w-64 shrink-0 flex-col gap-6 xl:flex">
            <div className="sticky top-20 space-y-4">
              {sidebar}
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            {children}
          </div>
        </main>
        <aside className="mx-auto max-w-[680px] px-4 py-6 xl:hidden">
          {sidebar}
        </aside>
      </div>
    )
  }

  if (activeStyle === 3) {
    return (
      <div className={styleClass}>
        <main className="mx-auto grid w-full max-w-7xl items-start gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_minmax(0,20rem)] xl:grid-cols-[1fr_minmax(0,24rem)] xl:gap-7">
          <div className="min-w-0">
            <div className="blog-toc-sticky hidden xl:block">
              {sidebar}
            </div>
            {children}
          </div>
          <div className="min-w-0 xl:hidden">
            {sidebar}
          </div>
        </main>
      </div>
    )
  }

  if (activeStyle === 5) {
    return (
      <div className={styleClass}>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="mx-auto space-y-6">
            {children}
          </div>
          <aside className="mx-auto mt-12 max-w-[680px] px-4">
            {sidebar}
          </aside>
        </main>
      </div>
    )
  }

  if (activeStyle === 7) {
    return (
      <div className={styleClass}>
        <main className="mx-auto w-full max-w-5xl px-4 py-12">
          <div className="mx-auto space-y-6">
            {children}
          </div>
        </main>
        <aside className="mx-auto max-w-4xl px-4 py-8">
          {sidebar}
        </aside>
      </div>
    )
  }

  if (activeStyle === 8) {
    return (
      <div className={styleClass}>
        <main className="mx-auto w-full max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-2">
            {children}
          </div>
        </main>
        <aside className="mx-auto max-w-7xl px-4 py-6">
          {sidebar}
        </aside>
      </div>
    )
  }

  if (activeStyle === 6) {
    return (
      <div className={styleClass}>
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
          <div className="space-y-6">
            {children}
          </div>
        </main>
        <aside className="mx-auto max-w-4xl px-4 py-8">
          {sidebar}
        </aside>
      </div>
    )
  }

  return (
    <div className={styleClass}>
      <main className="mx-auto grid w-full max-w-7xl items-start gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-7">
        <div className="min-w-0">
          {children}
        </div>
        <div className="min-w-0">
          {sidebar}
        </div>
      </main>
    </div>
  )
}
