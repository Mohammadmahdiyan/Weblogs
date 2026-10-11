import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import type { TocItem } from '../lib/toc'
import { useMediaQuery } from '../lib/useMediaQuery'

function useActiveHeading(items: TocItem[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || items.length === 0) return
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)
    if (elements.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = elements.find((element) => visible.has(element.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-80px 0px -65% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [enabled, items])

  return active
}

/**
 * Table of contents.
 * - `box`: inline card inside the article («نگاه کلی به مطالب») with brand pills.
 * - `side`: sticky "on this page" list with scroll-spy; collapsible on mobile.
 */
export function ArticleToc({ items, variant }: { items: TocItem[]; variant: 'box' | 'side' }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const active = useActiveHeading(items, variant === 'side')
  if (items.length === 0) return null

  const list = (
    <ul className="m-0 grid list-none gap-2 p-0">
      {items.map((item) => (
        <li key={item.id} className={item.level === 3 ? 'ps-5' : ''}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? 'location' : undefined}
            className={clsx(
              'flex items-center gap-3 text-start text-sm no-underline transition-colors hover:text-[var(--brand)]',
              active === item.id ? 'font-bold text-[var(--brand)]' : 'text-[var(--text-secondary)]',
            )}
          >
            {variant === 'box' && <span aria-hidden="true" className="h-1 w-2.5 shrink-0 rounded-[var(--radius-pill)] bg-[var(--brand-bright)]" />}
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  )

  if (variant === 'side') {
    return (
      <details open={isDesktop} className="article-toc rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] lg:border-0 lg:bg-transparent">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-start text-sm font-bold lg:cursor-default lg:px-0">
          <BookOpen aria-hidden="true" className="size-4 text-[var(--brand)]" />
          در این صفحه
        </summary>
        <nav aria-label="فهرست مطالب" className="px-4 pb-4 lg:px-0">{list}</nav>
      </details>
    )
  }

  return (
    <details open className="article-toc my-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 bg-[var(--surface-alt)] px-4 py-3 text-start text-sm font-bold text-[var(--text)]">
        <BookOpen aria-hidden="true" className="size-4 text-[var(--brand)]" />
        نگاه کلی به مطالب
      </summary>
      <nav aria-label="فهرست مطالب" className="px-4 py-3">{list}</nav>
    </details>
  )
}
