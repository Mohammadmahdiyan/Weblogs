import Fuse from 'fuse.js'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeSearchText } from '../lib/normalize'
import { decideSubmit, parseSearchQuery, toContentSearchQuery } from '../lib/search'
import type { ArticleMeta, SearchEntry } from '../lib/types'
import { useAdultAccess } from '../lib/adultAccess'

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

export function ArticleSearch({ articles, searchIndex, initialQuery = '' }: { articles: ArticleMeta[]; searchIndex: SearchEntry[]; initialQuery?: string }) {
  const navigate = useNavigate()
  const adultConfirmed = useAdultAccess()
  const safeArticles = articles
  const safeSearchIndex = searchIndex
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  // The query the current `results` were computed for. Until it equals `query`, “not found” must not be shown.
  const [settledQuery, setSettledQuery] = useState<string | null>(null)
  const listboxId = 'article-search-results'

  const normalizedEntries = useMemo(() => safeSearchIndex.map((entry) => ({
    ...entry,
    phrases: entry.phrases.map(normalizeSearchText),
  })), [safeSearchIndex])
  const fuse = useMemo(() => new Fuse(normalizedEntries, {
    keys: ['phrases', 'title'],
    includeScore: true,
    includeMatches: true,
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [normalizedEntries])

  const { contentSearch, term } = parseSearchQuery(query)
  const contentQuery = contentSearch ? term : ''

  useEffect(() => {
    const normalizedQuery = normalizeSearchText(contentSearch ? contentQuery : query)
    if (normalizedQuery.length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(() => {
      if (contentSearch) {
        const hits: SearchResult[] = safeSearchIndex.flatMap((entry) => {
          const body = normalizeSearchText(entry.content ?? '')
          const index = body.indexOf(normalizedQuery)
          if (index < 0) return []
          const originalBody = entry.content ?? ''
          const start = Math.max(0, index - 55)
          const end = Math.min(originalBody.length, index + normalizedQuery.length + 85)
          return [{ entry, score: 0, matchedPhrase: `${start > 0 ? '…' : ''}${originalBody.slice(start, end)}${end < originalBody.length ? '…' : ''}` }]
        }).slice(0, 8)
        setResults(hits)
      } else {
        const hits = fuse.search(normalizedQuery, { limit: 8 }).map((hit) => ({
          entry: safeSearchIndex.find((entry) => entry.slug === hit.item.slug) ?? hit.item,
          score: hit.score ?? 1,
          matchedPhrase: hit.item.phrases[hit.matches?.[0]?.refIndex ?? 0] ?? hit.item.title,
        }))
        setResults(hits)
      }
      setSettledQuery(query)
      setActiveIndex(-1)
      setOpen(true)
    }, 70)
    return () => window.clearTimeout(timer)
  }, [contentSearch, contentQuery, fuse, query, safeSearchIndex])

  const activeQueryLength = normalizeSearchText(contentSearch ? contentQuery : query).length
  const visibleResults = activeQueryLength >= 2 ? results : []
  const nothingFound = activeQueryLength >= 2 && settledQuery === query && visibleResults.length === 0
  // Offered only after a normal search found nothing; after a content search the plain “not found” remains.
  const contentSearchTarget = nothingFound ? toContentSearchQuery(query) : null
  const optionCount = visibleResults.length || (contentSearchTarget ? 1 : 0)

  function searchInContent() {
    if (!contentSearchTarget) return
    setQuery(contentSearchTarget)
    setActiveIndex(-1)
    setOpen(true)
    inputRef.current?.focus()
  }

  function submit() {
    if (contentSearchTarget && activeIndex === 0) {
      searchInContent()
      return
    }
    // Activating a highlighted option always wins.
    if (activeIndex >= 0 && visibleResults[activeIndex]) {
      navigate(`/blog/${visibleResults[activeIndex].entry.slug}`)
      return
    }
    if (contentSearch && visibleResults.length === 1) {
      navigate(`/blog/${visibleResults[0].entry.slug}`)
      return
    }
    const decision = decideSubmit(safeArticles, query, visibleResults.map((result) => ({ slug: result.entry.slug, score: result.score })))
    if (decision.action === 'navigate' && !contentSearch) navigate(`/blog/${decision.slug}`)
    else setOpen(true)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && optionCount) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % optionCount)
    } else if (event.key === 'ArrowUp' && optionCount) {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? optionCount - 1 : current - 1))
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
          aria-expanded={open && optionCount > 0}
          aria-activedescendant={activeIndex >= 0 ? `article-search-option-${activeIndex}` : undefined}
          value={query}
          onChange={(event) => { setQuery(event.currentTarget.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="عنوان را جست‌وجو کنید؛ برای متن: محتوا::عبارت"
          className="min-w-0 flex-1 bg-transparent py-3 text-start text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
        <button type="button" onClick={submit} aria-label="جست‌وجو" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]">
          <CornerDownLeft aria-hidden="true" className="size-4" />
        </button>
      </div>

      {open && activeQueryLength >= 2 && (visibleResults.length > 0 || nothingFound) && (
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
                    {(() => {
                      const restricted = !adultConfirmed && articles.some((article) => article.slug === entry.slug && article.adult === true)
                      return restricted ? (
                        <span className="relative block rounded-[var(--radius-sm)] py-1">
                          <span className="block select-none blur-sm" aria-hidden="true">
                            <span className="block text-sm font-semibold">{entry.title}</span>
                            <span className="block text-xs"><HighlightedPhrase text={matchedPhrase} query={contentSearch ? contentQuery : query} /></span>
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">حاوی جملات +۱۸</span>
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-[var(--text)]">{entry.title}</span>
                          <span className="text-xs text-[var(--text-secondary)]"><HighlightedPhrase text={matchedPhrase} query={contentSearch ? contentQuery : query} /></span>
                        </>
                      )
                    })()}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              {contentSearchTarget && (
                <button
                  id="article-search-option-0"
                  type="button"
                  role="option"
                  aria-selected={activeIndex === 0}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={searchInContent}
                  onMouseEnter={() => setActiveIndex(0)}
                  className="flex w-full items-center gap-3 border-b border-[var(--border-light)] px-4 py-3 text-start hover:bg-[var(--surface-alt)] aria-selected:bg-[var(--surface-alt)]"
                >
                  <Search aria-hidden="true" className="size-5 shrink-0 text-[var(--brand)]" />
                  <span className="grid min-w-0 gap-1">
                    <span className="text-sm font-semibold text-[var(--text)]">می‌خواهید در محتوا جست‌وجو کنید؟</span>
                    <span className="truncate text-xs text-[var(--text-secondary)]">{contentSearchTarget}</span>
                  </span>
                </button>
              )}
              <p role="status" className="m-0 px-4 py-5 text-start text-sm text-[var(--text-secondary)]">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</p>
            </div>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="polite">{visibleResults.length ? `${visibleResults.length} نتیجه` : ''}</div>
      {activeIndex >= 0 && <span className="sr-only"><ArrowUp /><ArrowDown /></span>}
    </div>
  )
}