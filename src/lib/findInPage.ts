import { useEffect } from 'react'
import { normalizeWithMap } from './normalize'

const HIGHLIGHT_NAME = 'search-hit'
/** How long the found text stays highlighted before the colour fades away. */
export const HIGHLIGHT_DURATION_MS = 5000
const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, div, section, summary, pre'
const SKIP_SELECTOR = 'script, style, .sr-only, .md-quote-icon'

function blockOf(node: Node): Element | null {
  return node.parentElement?.closest(BLOCK_SELECTOR) ?? null
}

/**
 * Finds an occurrence of `query` inside `root` (the first, or the 0-based `occurrence`-th), matching like the
 * search box does (ي/ی, ZWNJ, diacritics and digit forms are ignored), and returns it as a DOM Range.
 * When the page has fewer occurrences than asked for, the last one is used.
 */
export function locateText(root: Element, query: string, occurrence = 0): Range | null {
  const needle = normalizeWithMap(query).text
  if (!needle) return null

  const pieces: { node: Text; start: number }[] = []
  let text = ''
  let previousBlock: Element | null = null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    const node = current as Text
    if (node.parentElement?.closest(SKIP_SELECTOR)) continue
    const block = blockOf(node)
    // Paragraphs are separate words even though the DOM has no space between them.
    if (pieces.length > 0 && block !== previousBlock) text += ' '
    pieces.push({ node, start: text.length })
    text += node.data
    previousBlock = block
  }

  const body = normalizeWithMap(text)
  const found: number[] = []
  for (let at = body.text.indexOf(needle); at >= 0; at = body.text.indexOf(needle, at + needle.length)) found.push(at)
  if (found.length === 0) return null
  const index = found[Math.min(Math.max(0, occurrence), found.length - 1)]
  const rawStart = body.map[index]
  const rawEnd = body.map[index + needle.length - 1] + 1

  const locate = (offset: number, preferEnd: boolean) => {
    for (const piece of pieces) {
      const length = piece.node.data.length
      const inside = preferEnd ? offset > piece.start && offset <= piece.start + length : offset >= piece.start && offset < piece.start + length
      if (inside) return { node: piece.node, offset: offset - piece.start }
    }
    return null
  }
  const from = locate(rawStart, false)
  const to = locate(rawEnd, true)
  if (!from || !to) return null

  const range = document.createRange()
  range.setStart(from.node, from.offset)
  range.setEnd(to.node, to.offset)
  return range
}

/** Opens the accordion items / <details> that hide the range. Returns true when something was opened. */
export function revealRange(range: Range): boolean {
  let opened = false
  for (let element = range.startContainer.parentElement; element; element = element.parentElement) {
    if (element instanceof HTMLDetailsElement && !element.open) {
      element.open = true
      opened = true
    }
    if (element.classList.contains('accordion-item') && element.getAttribute('data-open') === 'false') {
      element.querySelector<HTMLButtonElement>('.accordion-trigger')?.click()
      opened = true
    }
  }
  return opened
}

type HighlightRegistry = { set(name: string, value: unknown): void; delete(name: string): void }

/** Marks the range (CSS Custom Highlight API; falls back to a normal text selection). Returns a cleanup. */
export function highlightRange(range: Range): () => void {
  const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights
  const HighlightClass = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight
  if (registry && HighlightClass) {
    registry.set(HIGHLIGHT_NAME, new HighlightClass(range))
    return () => registry.delete(HIGHLIGHT_NAME)
  }
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  return () => selection?.removeAllRanges()
}

function scrollToRange(range: Range, behavior: ScrollBehavior): void {
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - window.innerHeight * 0.35), behavior })
}

/**
 * After a content search, `?find=term` is in the article link. Once the article text is on screen this
 * scrolls to the chosen occurrence of the term and highlights it for a few seconds (opening any accordion that hides it).
 */
export function useFindInPage(term: string | null, ready: boolean, occurrence = 0): void {
  useEffect(() => {
    if (!term || !ready) return
    let cancelled = false
    let attempts = 0
    const timers: number[] = []
    let clearHighlight: (() => void) | undefined

    function attempt() {
      if (cancelled) return
      const body = document.querySelector('.article-body') ?? null
      const range = body ? locateText(body, term as string, occurrence) : null
      if (!range) {
        // The Markdown is rendered asynchronously; keep trying for a few seconds.
        if (++attempts < 40) timers.push(window.setTimeout(attempt, 100))
        return
      }
      const opened = revealRange(range)
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        clearHighlight = highlightRange(range)
        // The coloured background is only a pointer: it goes away by itself.
        timers.push(window.setTimeout(() => clearHighlight?.(), HIGHLIGHT_DURATION_MS))
        scrollToRange(range, 'smooth')
        // Images above the text can still be loading and push it down: correct once more.
        timers.push(window.setTimeout(() => !cancelled && scrollToRange(range, 'auto'), 700))
      }, opened ? 350 : 0))
    }
    attempt()

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
      clearHighlight?.()
    }
  }, [term, ready, occurrence])
}
