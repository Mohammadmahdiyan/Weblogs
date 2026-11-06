import Fuse from 'fuse.js'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeSearchText } from '../lib/normalize'
import { decideSubmit, parseSearchQuery, toContentSearchQuery } from '../lib/search'
import { articleHref, bodyOccurrence, findContentMatches, type ContentMatch } from '../lib/contentSearch'
import { pageTargets, parsePageQuery, suggestBooks } from '../lib/bookQuery'
import type { ArticleMeta, SearchEntry } from '../lib/types'
import { useAdultAccess } from '../lib/adultAccess'

interface SearchResult {
  entry: SearchEntry
  score: number
  matchedPhrase: string
  /** Content search only: every occurrence in the article, each with the match in the middle of its text. */
  matches?: ContentMatch[]
  /** Length of the title at the start of the indexed content (not part of the rendered article body). */
  titleLength?: number
  /** Books: «name ص۲۱۶» opens this page of the book. */
  jump?: { page: number; chapter?: string }
  /** Books: a name the typed text can be completed to (shows the ↑ button, Tab completes it). */
  suggestion?: boolean
}

function HighlightedPhrase({ text, query }: { text: string; query: string }) {
  const normalizedText = normalizeSearchText(text)
  const normalizedQuery = normalizeSearchText(query)
  const index = normalizedText.indexOf(normalizedQuery)
  if (!normalizedQuery || index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[var(--text)]">
        {text.slice(index, index + normalizedQuery.length)}
      </mark>
      {text.slice(index + normalizedQuery.length)}
    </>
  )
}

/** Content-search description: the found text sits in the middle, with equal context on both sides. */
function SnippetText({ snippet }: { snippet: ContentMatch }) {
  return (
    <>
      {snippet.before}
      <mark className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] px-0.5 font-semibold text-[var(--text)]">
        {snippet.match}
      </mark>
      {snippet.after}
    </>
  )
}

const stepButtonClass =
  'inline-flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-[var(--info)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]'

/**
 * `bookMode` (the books page) adds: completing a book's name (↑ button, ArrowUp/ArrowDown to pick, Tab to complete) and
 * «name ص۲۱۶» / «name صفحه ۲۱۶» to open that page of the book directly.
 */
export function ArticleSearch({
  articles,
  searchIndex,
  initialQuery = '',
  basePath = '/blog',
  bookMode = false,
  label,
  placeholder,
}: {
  articles: ArticleMeta[]
  searchIndex: SearchEntry[]
  initialQuery?: string
  basePath?: string
  bookMode?: boolean
  label?: string
  placeholder?: string
}) {
  const navigate = useNavigate()
  const adultConfirmed = useAdultAccess()
  const safeArticles = articles
  const safeSearchIndex = searchIndex
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  // Books: why a «name ص۲۱۶» query cannot open a page (the page does not exist).
  const [jumpNote, setJumpNote] = useState<string | null>(null)
  // The query the current `results` were computed for. Until it equals `query`, “not found” must not be shown.
  const [settledQuery, setSettledQuery] = useState<string | null>(null)
  // Content search: which occurrence (0-based) each result currently shows. Missing = the first.
  const [occurrences, setOccurrences] = useState<Record<string, number>>({})
  const listboxId = 'article-search-results'

  // Book pages (contentOnly) are found only by the «محتوا::» search, never by title.
  const normalizedEntries = useMemo(
    () =>
      safeSearchIndex
        .filter((entry) => !entry.contentOnly)
        .map((entry) => ({
          ...entry,
          phrases: entry.phrases.map(normalizeSearchText),
        })),
    [safeSearchIndex],
  )
  const fuse = useMemo(
    () =>
      new Fuse(normalizedEntries, {
        keys: ['phrases', 'title'],
        includeScore: true,
        includeMatches: true,
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [normalizedEntries],
  )

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
        const hits: SearchResult[] = safeSearchIndex
          .flatMap((entry) => {
            const content = entry.content ?? ''
            const matches = findContentMatches(content, contentQuery)
            if (matches.length === 0) return []
            const first = matches[0]
            const titleLength = content.startsWith(entry.title) ? entry.title.length : 0
            return [
              { entry, score: 0, matchedPhrase: `${first.before}${first.match}${first.after}`, matches, titleLength },
            ]
          })
          .slice(0, 8)
        setResults(hits)
      } else {
        const entryOf = (book: ArticleMeta): SearchEntry =>
          safeSearchIndex.find((entry) => entry.slug === book.slug) ?? {
            slug: book.slug,
            title: book.title,
            phrases: [],
          }
        const pageQuery = bookMode ? parsePageQuery(query) : null
        let note: string | null = null
        let hits: SearchResult[] | null = null

        if (pageQuery) {
          // «شرح صحیح بخاری ص۲۱۶»: open that page.
          const targets = pageTargets(safeArticles, pageQuery)
          hits = targets
            .filter((target) => target.exists)
            .map((target) => ({
              entry: entryOf(target.book),
              score: 0,
              matchedPhrase: '',
              jump: { page: target.page, ...(target.chapter ? { chapter: target.chapter } : {}) },
            }))
          if (hits.length === 0 && targets.length > 0) {
            const page = pageQuery.page.toLocaleString('fa-IR')
            const only = targets.length === 1 ? targets[0] : null
            note = only
              ? `صفحهٔ ${page} در «${only.book.title}» وجود ندارد${only.last !== null ? ` (آخرین صفحه: ${only.last.toLocaleString('fa-IR')})` : ' (این کتاب صفحه‌صفحه نیست)'}.`
              : `صفحهٔ ${page} در هیچ‌یک از کتاب‌های مشابه وجود ندارد.`
          }
        } else if (bookMode) {
          // Names that contain what was typed («شرح صح» → both «شرح صحیح …» books).
          const names = suggestBooks(safeArticles, query)
          if (names.length > 0)
            hits = names.map((book) => ({
              entry: entryOf(book),
              score: 0,
              matchedPhrase: book.title,
              suggestion: true,
            }))
        }

        setJumpNote(note)
        setResults(
          hits ??
            fuse.search(normalizedQuery, { limit: 8 }).map((hit) => ({
              entry: safeSearchIndex.find((entry) => entry.slug === hit.item.slug) ?? hit.item,
              score: hit.score ?? 1,
              matchedPhrase: hit.item.phrases[hit.matches?.[0]?.refIndex ?? 0] ?? hit.item.title,
            })),
        )
      }
      setSettledQuery(query)
      setOccurrences({})
      setActiveIndex(-1)
      setOpen(true)
    }, 70)
    return () => window.clearTimeout(timer)
  }, [bookMode, contentSearch, contentQuery, fuse, query, safeArticles, safeSearchIndex])

  const activeQueryLength = normalizeSearchText(contentSearch ? contentQuery : query).length
  const visibleResults = activeQueryLength >= 2 ? results : []
  const nothingFound = activeQueryLength >= 2 && settledQuery === query && visibleResults.length === 0
  // Offered only after a normal search found nothing; after a content search the plain “not found” remains.
  const contentSearchTarget = nothingFound && !jumpNote ? toContentSearchQuery(query) : null
  const optionCount = visibleResults.length || (contentSearchTarget ? 1 : 0)

  function searchInContent() {
    if (!contentSearchTarget) return
    setQuery(contentSearchTarget)
    setActiveIndex(-1)
    setOpen(true)
    inputRef.current?.focus()
  }

  // After a content search the article opens scrolled to (and highlighting) the found text.
  const occurrenceOf = (result: SearchResult) =>
    Math.min(occurrences[result.entry.slug] ?? 0, Math.max(0, (result.matches?.length ?? 1) - 1))
  const hrefFor = (result: SearchResult) => {
    if (result.jump) return `${basePath}/${result.entry.slug}/${result.jump.page}`
    if (!contentSearch) return articleHref(result.entry.slug, '', 0, basePath)
    const index = occurrenceOf(result)
    return articleHref(
      result.entry.slug,
      contentQuery,
      result.matches ? bodyOccurrence(result.matches, index, result.titleLength ?? 0) : 0,
      basePath,
    )
  }
  function stepOccurrence(result: SearchResult, step: -1 | 1) {
    const last = (result.matches?.length ?? 1) - 1
    const next = Math.min(last, Math.max(0, occurrenceOf(result) + step))
    setOccurrences((current) => ({ ...current, [result.entry.slug]: next }))
  }

  function submit() {
    if (contentSearchTarget && activeIndex === 0) {
      searchInContent()
      return
    }
    // Activating a highlighted option always wins.
    if (activeIndex >= 0 && visibleResults[activeIndex]) {
      navigate(hrefFor(visibleResults[activeIndex]))
      return
    }
    if (contentSearch && visibleResults.length === 1) {
      navigate(hrefFor(visibleResults[0]))
      return
    }
    // «name ص۲۱۶»: with nothing highlighted, Enter opens the best match's page.
    if (visibleResults[0]?.jump) {
      navigate(hrefFor(visibleResults[0]))
      return
    }
    const decision = decideSubmit(
      safeArticles,
      query,
      visibleResults.map((result) => ({ slug: result.entry.slug, score: result.score })),
    )
    if (decision.action === 'navigate' && !contentSearch) navigate(`${basePath}/${decision.slug}`)
    else setOpen(true)
  }

  // Books: put a book's full name in the box (so «ص۲۱۶» can be typed after it).
  function complete(title: string) {
    setQuery(`${title} `)
    setActiveIndex(-1)
    setOpen(true)
    inputRef.current?.focus()
  }
  const completable = bookMode && !contentSearch ? visibleResults.filter((result) => result.suggestion) : []

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Tab completes the highlighted name (or the first one). When the box already holds that name, Tab moves on as usual.
    if (event.key === 'Tab' && !event.shiftKey && open && completable.length > 0) {
      const highlighted = activeIndex >= 0 ? visibleResults[activeIndex] : undefined
      const target = highlighted?.suggestion ? highlighted : completable[0]
      if (normalizeSearchText(query) !== normalizeSearchText(target.entry.title)) {
        event.preventDefault()
        complete(target.entry.title)
      }
      return
    }
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
      <label htmlFor="article-search" className="sr-only">
        {label ?? (bookMode ? 'جست‌وجو در کتاب‌ها' : 'جست‌وجو در مقاله‌ها')}
      </label>
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
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={
            placeholder ??
            (bookMode
              ? 'نام کتاب (یا «نام کتاب ص ۲۱۶»)؛ برای متن: محتوا::عبارت'
              : 'عنوان را جست‌وجو کنید؛ برای متن: محتوا::عبارت')
          }
          className="min-w-0 flex-1 bg-transparent py-3 text-start text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="button"
          onClick={submit}
          aria-label="جست‌وجو"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]"
        >
          <CornerDownLeft aria-hidden="true" className="size-4" />
        </button>
      </div>

      {open && activeQueryLength >= 2 && (visibleResults.length > 0 || nothingFound) && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          {visibleResults.length ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="نتایج جست‌وجو"
              className="m-0 max-h-[min(60vh,28rem)] list-none overflow-y-auto p-1"
            >
              {visibleResults.map((result, index) => {
                const { entry, matchedPhrase, matches } = result
                const total = matches?.length ?? 0
                const current = occurrenceOf(result)
                const snippet = matches?.[current]
                const restricted =
                  !adultConfirmed &&
                  articles.some(
                    (article) =>
                      (entry.slug === article.slug || entry.slug.startsWith(`${article.slug}/`)) &&
                      article.adult === true,
                  )
                return (
                  <li key={entry.slug} className="flex items-stretch gap-1">
                    <button
                      id={`article-search-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigate(hrefFor(result))}
                      onMouseEnter={() => setActiveIndex(index)}
                      className="grid min-w-0 flex-1 gap-1 rounded-[var(--radius-sm)] px-4 py-3 text-start hover:bg-[var(--surface-alt)] aria-selected:bg-[var(--surface-alt)]"
                    >
                      {restricted ? (
                        <span className="relative block rounded-[var(--radius-sm)] py-1">
                          <span className="block blur-sm select-none" aria-hidden="true">
                            <span className="block text-sm font-semibold">{entry.title}</span>
                            <span className="block text-center text-xs">
                              {snippet ? (
                                <SnippetText snippet={snippet} />
                              ) : (
                                <HighlightedPhrase text={matchedPhrase} query={contentSearch ? contentQuery : query} />
                              )}
                            </span>
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                            حاوی جملات +۱۸
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-[var(--text)]">
                            {result.suggestion ? <HighlightedPhrase text={entry.title} query={query} /> : entry.title}
                          </span>
                          {result.jump ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                              <CornerDownLeft aria-hidden="true" className="size-3.5 text-[var(--brand)]" />
                              رفتن به صفحهٔ {result.jump.page.toLocaleString('fa-IR')}
                              {result.jump.chapter ? ` · ${result.jump.chapter}` : ''}
                            </span>
                          ) : (
                            !result.suggestion && (
                              <span className={clsx('text-xs text-[var(--text-secondary)]', snippet && 'text-center')}>
                                {snippet ? (
                                  <SnippetText snippet={snippet} />
                                ) : (
                                  <HighlightedPhrase text={matchedPhrase} query={query} />
                                )}
                              </span>
                            )
                          )}
                        </>
                      )}
                    </button>
                    {result.suggestion && (
                      <button
                        type="button"
                        aria-label={`تکمیل نام کتاب: ${entry.title}`}
                        title="تکمیل در کادر جست‌وجو (Tab)"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => complete(entry.title)}
                        className={clsx(stepButtonClass, 'size-9 shrink-0 self-center')}
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </button>
                    )}
                    {total > 0 && !restricted && (
                      <div
                        role="group"
                        aria-label="مورد قبلی و بعدی در این مقاله"
                        className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1"
                      >
                        <button
                          type="button"
                          aria-label="مورد قبلی"
                          title="مورد قبلی"
                          disabled={current <= 0}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => stepOccurrence(result, -1)}
                          className={stepButtonClass}
                        >
                          <ArrowUp aria-hidden="true" className="size-4" />
                        </button>
                        <span className="text-[10px] leading-none text-[var(--muted)] tabular-nums" aria-live="polite">
                          {(current + 1).toLocaleString('fa-IR')} از {total.toLocaleString('fa-IR')}
                        </span>
                        <button
                          type="button"
                          aria-label="مورد بعدی"
                          title="مورد بعدی"
                          disabled={current >= total - 1}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => stepOccurrence(result, 1)}
                          className={stepButtonClass}
                        >
                          <ArrowDown aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
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
              <p role="status" className="m-0 px-4 py-5 text-start text-sm text-[var(--text-secondary)]">
                {jumpNote ?? 'نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.'}
              </p>
            </div>
          )}
          {bookMode && !contentSearch && visibleResults.length > 0 && (
            <p className="m-0 border-t border-[var(--border-light)] px-4 py-2 text-start text-[11px] leading-5 text-[var(--muted)]">
              ↑ ↓ انتخاب · Tab تکمیل نام کتاب · Enter باز کردن · برای رفتن به صفحه بنویسید «نام کتاب ص ۲۱۶»
            </p>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {visibleResults.length ? `${visibleResults.length} نتیجه` : ''}
      </div>
    </div>
  )
}
