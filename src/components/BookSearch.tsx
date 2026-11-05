import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { siteCollections } from '../lib/collections'
import { bookEntries, searchEntry, type BookHit } from '../lib/bookSearch'
import { articleHref } from '../lib/contentSearch'
import type { BookPageMeta } from '../lib/types'

/** Enough to find the spot; more would only make the list long. */
const MAX_HITS = 60
/** Pages searched per turn of the browser's loop, so a book with thousands of pages never freezes the screen. */
const CHUNK = 25
/** Results appear by themselves from this many characters (like the content search on the home page). */
const MIN_CHARS = 3
/** Wait for a pause in typing before searching. */
const TYPING_PAUSE_MS = 250

interface Result {
  term: string
  hits: BookHit[]
  done: boolean
}

/**
 * «جست‌وجو در کتاب»: a compact button (icon + short label) that opens a small floating panel, so it takes no room in
 * the page. It searches the text of EVERY page of this one book as you type (from 3 characters) and jumps to the
 * exact spot (`?find=`).
 */
export function BookSearch({ bookSlug, pages }: { bookSlug: string; pages: BookPageMeta[] | undefined }) {
  const navigate = useNavigate()
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const term = query.trim()
  const active = term.length >= MIN_CHARS

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Close on Escape and when clicking elsewhere.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onPointer = (event: PointerEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  // Search automatically: after a short typing pause, in small slices so the screen stays responsive. Typing again
  // (or leaving) cancels the running search.
  useEffect(() => {
    if (!open || !active) return
    let cancelled = false
    let timer = 0
    const entries = bookEntries(siteCollections.books.searchIndex, bookSlug)
    const found: BookHit[] = []
    let next = 0

    const step = () => {
      if (cancelled) return
      for (const end = Math.min(entries.length, next + CHUNK); next < end && found.length < MAX_HITS; next += 1) {
        found.push(...searchEntry(entries[next], bookSlug, term))
      }
      const done = next >= entries.length || found.length >= MAX_HITS
      setResult({ term, hits: found.slice(0, MAX_HITS), done })
      if (!done) timer = window.setTimeout(step, 0)
    }
    timer = window.setTimeout(step, TYPING_PAUSE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, active, term, bookSlug])

  function go(hit: BookHit) {
    setOpen(false)
    navigate(articleHref(hit.slug, term, hit.occurrence, '/books'))
  }

  // Results belong to the text they were searched for; anything older is not shown.
  const current = active && result?.term === term ? result : null
  const hits = current?.hits ?? []
  const searching = active && (!current || !current.done)

  const titleOf = (page: number | null) => {
    if (page === null) return 'معرفی کتاب'
    const chapter = pages?.find((item) => item.number === page)?.title
    return chapter ? `صفحه ${page.toLocaleString('fa-IR')} · ${chapter}` : `صفحه ${page.toLocaleString('fa-IR')}`
  }

  return (
    // `contents`: this wrapper has no box of its own. The button sits in the page's breadcrumb row and the panel is
    // positioned against that row (`relative` there), so on a phone it can use the row's full width.
    <div ref={rootRef} className="contents">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="جست‌وجو در متن کتاب" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)] sm:text-sm"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span aria-hidden="true" className="sm:hidden">جست‌وجو</span>
        <span aria-hidden="true" className="hidden sm:inline">جست‌وجو در کتاب</span>
      </button>

      {open && (
        <div id={panelId} role="dialog" aria-label="جست‌وجو در متن کتاب" className="absolute inset-x-0 top-full z-30 mt-2 rounded-[var(--radius-md)] sm:inset-x-auto sm:end-0 sm:w-[26rem] border border-[var(--border-light)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
          <form onSubmit={(event) => event.preventDefault()} className="flex items-center gap-2">
            <Search aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)]" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="حداقل ۳ حرف بنویسید"
              aria-label="عبارت جست‌وجو در متن کتاب"
              enterKeyHint="search"
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)]"
            />
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">
              <X aria-hidden="true" className="size-4" />
            </button>
          </form>

          <p role="status" className="m-0 mt-2 min-h-5 text-start text-xs text-[var(--text-secondary)]">
            {term.length > 0 && !active && `${MIN_CHARS.toLocaleString('fa-IR')} حرف یا بیشتر بنویسید.`}
            {searching && 'در حال جست‌وجو…'}
            {current?.done && hits.length === 0 && 'نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.'}
            {current?.done && hits.length > 0 && (hits.length >= MAX_HITS ? `${MAX_HITS.toLocaleString('fa-IR')} نتیجهٔ اول؛ برای دقیق‌تر شدن، عبارت بلندتری بنویسید.` : `${hits.length.toLocaleString('fa-IR')} نتیجه`)}
          </p>

          {hits.length > 0 && (
            <ul className="m-0 mt-1 max-h-[min(55vh,24rem)] list-none overflow-y-auto p-0">
              {hits.map((hit) => (
                <li key={`${hit.slug}-${hit.occurrence}`}>
                  <button type="button" onClick={() => go(hit)} className="grid w-full gap-1 rounded-[var(--radius-sm)] px-3 py-2.5 text-start hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">
                    <span className="text-xs font-semibold text-[var(--text)]">{titleOf(hit.page)}</span>
                    <span className="text-xs leading-6 text-[var(--text-secondary)]">
                      {hit.snippet.before}
                      <mark className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] px-0.5 font-semibold text-[var(--text)]">{hit.snippet.match}</mark>
                      {hit.snippet.after}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
