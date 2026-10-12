import { useRef } from 'react'
import { useMatch, useSearchParams } from 'react-router-dom'
import { Check, Palette } from 'lucide-react'
import { clsx } from 'clsx'
import siteConfig from '../site.config'
import type { ArticleMeta } from '../lib/types'
import { STYLE_IDS, layouts, normalizeStyle } from '../layouts'

/**
 * Header button that switches the blog style of the article being read.
 * It only appears on /blog/:slug and works through the `?style=N` query parameter
 * (the same override documented in the README), so the choice is shareable by link.
 */
export function StyleSwitcher({ articles }: { articles: ArticleMeta[] }) {
  const match = useMatch('/blog/:slug')
  const [searchParams, setSearchParams] = useSearchParams()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  if (!match) return null

  const article = articles.find((item) => item.slug === match.params.slug)
  const requested = Number(searchParams.get('style'))
  const active = normalizeStyle(requested >= 1 ? requested : article?.style ?? siteConfig.defaultStyle)

  function pick(style: number) {
    const params = new URLSearchParams(searchParams)
    params.set('style', String(style))
    setSearchParams(params, { replace: true })
    detailsRef.current?.removeAttribute('open')
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label="تغییر استایل مقاله"
        title="تغییر استایل مقاله"
        className="inline-flex size-10 cursor-pointer list-none items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] sm:w-auto sm:px-3 sm:text-sm [&::-webkit-details-marker]:hidden"
      >
        <Palette aria-hidden="true" className="size-5 sm:size-4" />
        <span className="hidden sm:inline">استایل</span>
      </summary>
      <ul role="list" className="absolute end-0 top-full z-10 mt-2 grid w-60 list-none gap-1 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-2 text-[var(--text)] shadow-lg">
        {STYLE_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={active === id}
              onClick={() => pick(id)}
              className={clsx(
                'flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-start text-sm',
                active === id ? 'bg-[var(--surface-strong)] font-bold' : 'hover:bg-[var(--surface-alt)]',
              )}
            >
              <span>{layouts[id].name}</span>
              {active === id && <Check aria-hidden="true" className="size-4 text-[var(--brand)]" />}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
