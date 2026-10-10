import Fuse from 'fuse.js'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeSearchText } from '../lib/normalize'
import type { ArticleMeta, SearchEntry } from '../lib/types'

interface SearchResult {
  entry: SearchEntry
  score: number
  matchedPhrase: string
}

function HighlightedPhrase({ text, query }: { text: string; query: string }) {
  const normalizedText = normalizeSearchText(text)
  const normalizedQuery = normalizeSearchText(query)
  const index = normalizedText.indexOf(normalizedQuery)
  if (!normalizedQuery || index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<mark className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[var(--text)]">{text.slice(index, index + normalizedQuery.length)}</mark>{text.slice(index + normalizedQuery.length)}</>
}

export function ArticleSearch({ articles, searchIndex }: { articles: ArticleMeta[]; searchIndex: SearchEntry[] }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const listboxId = 'article-search-results'

  const normalizedEntries = useMemo(() => searchIndex.map((entry) => ({
    ...entry,
    phrases: entry.phrases.map(normalizeSearchText),
  })), [searchIndex])
  const fuse = useMemo(() => new Fuse(normalizedEntries, {
    keys: ['phrases', 'title'],
    includeScore: true,
    includeMatches: true,
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [normalizedEntries])

  useEffect(() => {
    const normalizedQuery = normalizeSearchText(query)
    if (normalizedQuery.length < 2) return

    const timer = window.setTimeout(() => {
      const hits = fuse.search(normalizedQuery, { limit: 8 }).map((hit) => ({
        entry: searchIndex.find((entry) => entry.slug === hit.item.slug) ?? hit.item,
        score: hit.score ?? 1,
        matchedPhrase: hit.item.phrases[hit.matches?.[0]?.refIndex ?? 0] ?? hit.item.title,
      }))
      setResults(hits)
      setActiveIndex(-1)
      setOpen(true)
    }, 70)
    return () => window.clearTimeout(timer)
  }, [fuse, query, searchIndex])

  const visibleResults = normalizeSearchText(query).length >= 2 ? results : []

  function findExactMatches(value: string) {
    const normalized = normalizeSearchText(value)
    return articles.filter((article) => [article.title, ...article.suggestions].some((phrase) => normalizeSearchText(phrase) === normalized))
  }

  function submit() {
    const exactMatches = findExactMatches(query)
    if (exactMatches.length === 1) {
      navigate(`/blog/${exactMatches[0].slug}`)
      return
    }

    // Only an unusually strong, unambiguous fuzzy result (Fuse score <= 0.08) auto-navigates.
    if (exactMatches.length === 0 && visibleResults.length === 1 && visibleResults[0].score <= 0.08) {
      navigate(`/blog/${visibleResults[0].entry.slug}`)
      return
    }
    if (activeIndex >= 0 && visibleResults[activeIndex]) navigate(`/blog/${visibleResults[activeIndex].entry.slug}`)
    else setOpen(true)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && visibleResults.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % visibleResults.length)
    } else if (event.key === 'ArrowUp' && visibleResults.length) {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? visibleResults.length - 1 : current - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <label htmlFor="article-search" className="sr-only">جست‌وجو در مقاله‌ها</label>
      <div className="flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 shadow-[var(--shadow-card)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--brand)_20%,transparent)]">
        <Search aria-hidden="true" className="size-5 shrink-0 text-[var(--muted)]" />
        <input
          ref={inputRef}
          id="article-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open && visibleResults.length > 0}
          aria-activedescendant={activeIndex >= 0 ? `article-search-option-${activeIndex}` : undefined}
          value={query}
          onChange={(event) => { setQuery(event.currentTarget.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="عنوان یا پرسش خود را جست‌وجو کنید…"
          className="min-w-0 flex-1 bg-transparent py-3 text-start text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
        <button type="button" onClick={submit} aria-label="جست‌وجو" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]">
          <CornerDownLeft aria-hidden="true" className="size-4" />
        </button>
      </div>

      {open && normalizeSearchText(query).length >= 2 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          {visibleResults.length ? (
            <ul id={listboxId} role="listbox" aria-label="نتایج جست‌وجو" className="m-0 max-h-[min(60vh,28rem)] list-none overflow-y-auto p-1">
              {visibleResults.map(({ entry, matchedPhrase }, index) => (
                <li key={entry.slug}>
                  <button
                    id={`article-search-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigate(`/blog/${entry.slug}`)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="grid w-full gap-1 rounded-[var(--radius-sm)] px-4 py-3 text-start hover:bg-[var(--surface-alt)] aria-selected:bg-[var(--surface-alt)]"
                  >
                    <span className="text-sm font-semibold text-[var(--text)]">{entry.title}</span>
                    <span className="text-xs text-[var(--text-secondary)]"><HighlightedPhrase text={matchedPhrase} query={query} /></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="m-0 px-4 py-5 text-start text-sm text-[var(--text-secondary)]">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</p>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="polite">{visibleResults.length ? `${visibleResults.length} نتیجه` : ''}</div>
      {activeIndex >= 0 && <span className="sr-only"><ArrowUp /><ArrowDown /></span>}
    </div>
  )
}