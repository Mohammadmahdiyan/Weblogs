import { clsx } from 'clsx'
import { ArrowRight } from 'lucide-react'

const MAX_PAGE_BUTTONS = 7

/** Page buttons for a list: previous, up to 7 numbers around the current page, next. Everything happens in the page (no reload). */
export function ArticlePagination({ pageCount, current, onChange }: { pageCount: number; current: number; onChange: (page: number) => void }) {
  if (pageCount <= 1) return null

  const shown = Math.min(pageCount, MAX_PAGE_BUTTONS)
  const first = Math.max(1, Math.min(current - 3, pageCount - shown + 1))
  const pages = Array.from({ length: shown }, (_unused, index) => first + index)
  const arrowButton = 'rounded-[var(--radius-sm)] border border-[var(--border-light)] px-3 py-2 text-[var(--text-muted)] hover:bg-[var(--surface-alt)] disabled:opacity-50 disabled:hover:bg-transparent'

  return (
    <nav aria-label="صفحه‌بندی" className="not-prose my-8 flex flex-wrap items-center justify-center gap-1">
      <button type="button" aria-label="صفحه قبل" disabled={current <= 1} onClick={() => onChange(current - 1)} className={arrowButton}>
        <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          aria-label={`صفحه ${page.toLocaleString('fa-IR')}`}
          aria-current={page === current ? 'page' : undefined}
          onClick={() => onChange(page)}
          className={clsx('min-h-9 min-w-9 rounded-[var(--radius-sm)] border px-2 py-1 text-sm', page === current ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]' : 'border-[var(--border-light)] text-[var(--text)] hover:bg-[var(--surface-alt)]')}
        >
          {page.toLocaleString('fa-IR')}
        </button>
      ))}
      <button type="button" aria-label="صفحه بعد" disabled={current >= pageCount} onClick={() => onChange(current + 1)} className={arrowButton}>
        <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  )
}
