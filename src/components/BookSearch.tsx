import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
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

/**
 * «جست‌وجو در کتاب»: a compact button (icon + short label) that opens a small floating panel, so it takes no room in
 * the page. It searches the text of EVERY page of this one book and jumps to the exact spot (`?find=`).
 */
export function BookSearch({ bookSlug, pages }: { bookSlug: string; pages: BookPageMeta[] | undefined }) {
  const navigate = useNavigate()
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const runId = useRef(0)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<BookHit[]>([])
  const [state, setState] = useState<'idle' | 'searching' | 'done'>('idle')
  const [searched, setSearched] = useState('')

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

  // Another book (or page change that unmounts us) cancels a running search.
  useEffect(() => () => { runId.current += 1 }, [])

  function run(event?: FormEvent) {
    event?.preventDefault()
    const term = query.trim()
    const id = ++runId.current
    if (term.length < 2) {
      setHits([])
      setState('idle')
      return
    }

    const entries = bookEntries(siteCollections.books.searchIndex, bookSlug)
    const found: BookHit[] = []
    setSearched(term)
    setHits([])
    setState('searching')

    let next = 0
    const step = () => {
      if (id !== runId.current) return
      for (const end = Math.min(entries.length, next + CHUNK); next < end && found.length < MAX_HITS; next += 1) {
        found.push(...searchEntry(entries[next], bookSlug, term))
      }
      setHits(found.slice(0, MAX_HITS))
      if (next < entries.length && found.length < MAX_HITS) window.setTimeout(step, 0)
      else setState('done')
    }
    window.setTimeout(step, 0)
  }

  function go(hit: BookHit) {
    setOpen(false)
    navigate(articleHref(hit.slug, searched, hit.occurrence, '/books'))
  }

  const titleOf = (page: number | null) => {
    if (page === null) return 'معرفی کتاب'
    const chapter = pages?.find((item) => item.number === page)?.title
    return chapter ? `صفحه ${page.toLocaleString('fa-IR')} · ${chapter}` : `صفحه ${page.toLocaleString('fa-IR')}`
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)] sm:text-sm"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        جست‌وجو در کتاب
      </button>

      {open && (
        <div id={panelId} role="dialog" aria-label="جست‌وجو در متن کتاب" className="absolute end-0 top-full z-30 mt-2 w-[min(92vw,26rem)] rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
          <form onSubmit={run} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="عبارت را بنویسید و Enter بزنید"
              aria-label="عبارت جست‌وجو در متن کتاب"
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)]"
            />
            <button type="submit" aria-label="جست‌وجو" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]">
              <Search aria-hidden="true" className="size-4" />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">
              <X aria-hidden="true" className="size-4" />
            </button>
          </form>

          <p role="status" className="m-0 mt-2 min-h-5 text-start text-xs text-[var(--text-secondary)]">
            {state === 'searching' && 'در حال جست‌وجو…'}
            {state === 'done' && hits.length === 0 && 'نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.'}
            {state === 'done' && hits.length > 0 && (hits.length >= MAX_HITS ? `${MAX_HITS.toLocaleString('fa-IR')} نتیجهٔ اول؛ برای دقیق‌تر شدن، عبارت بلندتری بنویسید.` : `${hits.length.toLocaleString('fa-IR')} نتیجه`)}
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
