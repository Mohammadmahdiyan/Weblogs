import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ArticleMeta, BookPageMeta } from '../lib/types'
import { parseTypedPage } from '../lib/bookPages'
import { usePageMeta } from '../lib/usePageMeta'

function pageLabel(page: BookPageMeta): string {
  const number = page.number.toLocaleString('fa-IR')
  return page.title ? `صفحه ${number} · ${page.title}` : `صفحه ${number}`
}

export function PendingBookPage({ book, page }: { book: ArticleMeta; page: string }) {
  const navigate = useNavigate()
  const pageNumber = Number(page)
  const bookPath = `/books/${book.slug}`
  const pages = [...(book.pages ?? [])].sort((first, second) => first.number - second.number)
  const previous = pages.filter((item) => item.number < pageNumber).at(-1)
  const next = pages.find((item) => item.number > pageNumber)
  const maximumPendingPage = book.pageCount ?? (book.pages !== undefined ? 10000 : undefined)
  const [target, setTarget] = useState('')
  const [invalid, setInvalid] = useState(false)

  usePageMeta({
    title: `${book.title} — صفحه ${pageNumber}`,
    description: `صفحه ${pageNumber} از کتاب «${book.title}» هنوز اضافه نشده است.`,
    type: 'article',
    noindex: true,
  })

  function goToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requestedPage = parseTypedPage(target)
    const exists = pages.some((item) => item.number === requestedPage)
    const isPending =
      requestedPage >= 1 && maximumPendingPage !== undefined && requestedPage <= maximumPendingPage
    if (!exists && !isPending) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    navigate(`${bookPath}/${requestedPage}`)
  }

  return (
    <main
      id="main-content"
      className="mx-auto grid min-h-[55vh] max-w-3xl content-center justify-items-center gap-5 px-4 py-16 text-center"
    >
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--brand)]">کتاب</p>
        <h1 className="mb-3 text-3xl font-extrabold">صفحه {pageNumber.toLocaleString('fa-IR')} هنوز اضافه نشده است</h1>
        <p className="m-0 text-[var(--text-secondary)]">
          این صفحه از کتاب «{book.title}» هنوز در سایت قرار نگرفته است.
        </p>
      </div>

      <Link
        to={bookPath}
        className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline hover:bg-[var(--brand-dark)]"
      >
        رفتن به معرفی کتاب «{book.title}»
      </Link>

      {(previous || next) && (
        <nav aria-label="صفحه‌های موجود نزدیک" className="flex flex-wrap justify-center gap-3">
          {previous && (
            <Link
              to={`${bookPath}/${previous.number}`}
              rel="prev"
              className="rounded-[var(--radius-sm)] border border-[var(--border-light)] px-4 py-2 text-sm text-[var(--brand)] no-underline hover:border-[var(--brand)]"
            >
              صفحهٔ قبلیِ موجود: {pageLabel(previous)}
            </Link>
          )}
          {next && (
            <Link
              to={`${bookPath}/${next.number}`}
              rel="next"
              className="rounded-[var(--radius-sm)] border border-[var(--border-light)] px-4 py-2 text-sm text-[var(--brand)] no-underline hover:border-[var(--brand)]"
            >
              صفحهٔ بعدیِ موجود: {pageLabel(next)}
            </Link>
          )}
        </nav>
      )}

      {maximumPendingPage !== undefined && (
        <form onSubmit={goToPage} className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <label htmlFor="pending-book-page" className="text-[var(--text-secondary)]">
            برو به صفحه
          </label>
          <input
            id="pending-book-page"
            inputMode="numeric"
            autoComplete="off"
            placeholder={String(maximumPendingPage)}
            value={target}
            onChange={(event) => {
              setTarget(event.currentTarget.value)
              setInvalid(false)
            }}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'pending-book-page-error' : undefined}
            className="w-28 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-center text-[var(--text)] outline-none focus-visible:border-[var(--brand)]"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 py-2 font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)]"
          >
            برو
          </button>
          {invalid && (
            <span id="pending-book-page-error" role="alert" className="w-full text-xs text-[var(--danger)]">
              شمارهٔ صفحه معتبر نیست.
            </span>
          )}
        </form>
      )}
    </main>
  )
}
