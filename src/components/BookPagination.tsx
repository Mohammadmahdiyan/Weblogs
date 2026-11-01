import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { bookNavigation, jumpLabel, lastPageHint, parseTypedPage, stopPath, type PageJump } from '../lib/bookPages'
import type { BookPageMeta } from '../lib/types'

const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)] sm:text-sm'

/**
 * The bar under a book page: previous / next page and jumps of 10, 100, 1000 and 10000 pages (each only when the
 * book has that many pages ahead or behind). A book with no page files (just index.md) shows nothing.
 */
export function BookPagination({ bookPath, pages, current }: { bookPath: string; pages: BookPageMeta[] | undefined; current: number | null }) {
  const navigate = useNavigate()
  const [target, setTarget] = useState('')
  const [missing, setMissing] = useState(false)
  const navigation = bookNavigation(pages, current)
  if (!navigation) return null

  const { back, forward, position, total, stops, first, last } = navigation
  const pageCount = stops.length - 1

  function jump(item: PageJump, direction: 'back' | 'forward') {
    return (
      <Link key={`${direction}-${item.step}`} to={stopPath(bookPath, item.to)} rel={item.step === 1 ? (direction === 'back' ? 'prev' : 'next') : undefined} className={clsx(buttonClass, item.step === 1 && 'bg-[var(--surface-alt)]')}>
        {direction === 'back' && <ChevronRight aria-hidden="true" className="size-4 shrink-0 ltr:rotate-180" />}
        {jumpLabel(item.step, direction)}
        {direction === 'forward' && <ChevronLeft aria-hidden="true" className="size-4 shrink-0 ltr:rotate-180" />}
      </Link>
    )
  }

  function goTo(event: FormEvent) {
    event.preventDefault()
    const number = parseTypedPage(target)
    const stop = stops.find((item) => item.number === number)
    if (!stop) {
      setMissing(true)
      return
    }
    setMissing(false)
    setTarget('')
    navigate(stopPath(bookPath, stop))
  }

  const currentLabel = current === null ? 'معرفی کتاب' : `صفحه ${current.toLocaleString('fa-IR')}`

  return (
    <nav aria-label="صفحه‌های کتاب" className="mt-8 grid gap-3 border-t border-[var(--border-light)] pt-5">
      <p className="m-0 text-center text-sm text-[var(--text-secondary)]">
        {currentLabel}
        <span className="mx-2 text-[var(--muted)]" aria-hidden="true">·</span>
        {position.toLocaleString('fa-IR')} از {pageCount.toLocaleString('fa-IR')} صفحه
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {current !== first.number && <Link to={stopPath(bookPath, first)} aria-label={`رفتن به اولین صفحه (${lastPageHint(first)})`} className={buttonClass}>اولین</Link>}
        {back.map((item) => jump(item, 'back'))}
        {forward.map((item) => jump(item, 'forward'))}
        {current !== last.number && <Link to={stopPath(bookPath, last)} aria-label={`رفتن به آخرین صفحه (${lastPageHint(last)})`} className={buttonClass}>آخرین</Link>}
      </div>
      {total > 2 && (
        <form onSubmit={goTo} className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <label htmlFor="book-goto" className="text-[var(--text-secondary)]">برو به</label>
          <input
            id="book-goto"
            inputMode="numeric"
            autoComplete="off"
            placeholder={lastPageHint(last)}
            value={target}
            onChange={(event) => { setTarget(event.target.value); setMissing(false) }}
            aria-invalid={missing}
            aria-describedby={missing ? 'book-goto-error' : undefined}
            className="w-24 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-center text-[var(--text)] outline-none focus-visible:border-[var(--brand)]"
          />
          <button type="submit" className={buttonClass}>برو</button>
          {missing && <span id="book-goto-error" role="alert" className="text-xs text-[var(--danger)]">چنین صفحه‌ای نیست (آخرین صفحه: {lastPageHint(last)}).</span>}
        </form>
      )}
    </nav>
  )
}
