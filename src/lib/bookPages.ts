import type { BookPageMeta } from './types.ts'

/** Jump sizes, smallest first: 1, 10, 100, 1000, 10000 pages. */
export const PAGE_STEPS = [1, 10, 100, 1000, 10000] as const

export interface PageStop {
  /** Page number (1…), or null for the book's introduction (index.md). */
  number: number | null
  title?: string
}

export interface PageJump {
  step: number
  /** Where it goes: position in the stops list. */
  to: PageStop
}

export interface BookNavigation {
  /** Position of the current page in the list (the introduction is position 0). */
  position: number
  total: number
  stops: PageStop[]
  /** The first and the last numbered page (the introduction is not a numbered page). */
  first: PageStop
  last: PageStop
  /** Back jumps, from the biggest step to 1 (so they sit next to «previous» in reading order). */
  back: PageJump[]
  /** Forward jumps, from 1 to the biggest step. */
  forward: PageJump[]
}

/**
 * The reading order of a book: its introduction (index.md), then page 1, 2, 3… in NUMBER order (so `10.md` comes
 * after `9.md`, and a missing number is simply skipped). A jump of N goes N pages along that list, and exists only
 * when the list is long enough: a book of 60 pages has «10 pages» buttons but no «100 pages» button.
 * Returns null for a book with no page files: nothing to navigate.
 */
export function bookNavigation(pages: readonly BookPageMeta[] | undefined, current: number | null): BookNavigation | null {
  if (!pages || pages.length === 0) return null
  const stops: PageStop[] = [{ number: null }, ...[...pages].sort((first, second) => first.number - second.number).map((page) => ({ number: page.number, title: page.title }))]
  const position = stops.findIndex((stop) => stop.number === current)
  if (position === -1) return null

  const back: PageJump[] = []
  const forward: PageJump[] = []
  for (const step of PAGE_STEPS) {
    if (position - step >= 0) back.unshift({ step, to: stops[position - step] })
    if (position + step <= stops.length - 1) forward.push({ step, to: stops[position + step] })
  }
  return { position, total: stops.length, stops, first: stops[1], last: stops[stops.length - 1], back, forward }
}

/** Persian label of a jump: «صفحه بعد», «ده صفحه قبل», «۱۰۰ صفحه بعد»… */
export function jumpLabel(step: number, direction: 'back' | 'forward'): string {
  const side = direction === 'back' ? 'قبل' : 'بعد'
  const amount = step === 1 ? '' : step === 10 ? 'ده ' : `${step.toLocaleString('fa-IR')} `
  return `${amount}صفحه ${side}`
}

/** `/books/<slug>` for the introduction, `/books/<slug>/<number>` for a page. */
export function stopPath(bookPath: string, stop: PageStop): string {
  return stop.number === null ? bookPath : `${bookPath}/${stop.number}`
}

/** Reads the `:page` of the address: undefined = no page asked (the introduction), NaN = not a valid page number. */
export function parsePageParam(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  return /^[1-9]\d{0,5}$/.test(value) ? Number(value) : Number.NaN
}

/** The page number shown as the hint of the «go to page» box: the last page (100 pages → 100, 4000 → 4000). */
export function lastPageHint(last: PageStop): string {
  return last.number === null ? '' : last.number.toLocaleString('fa-IR', { useGrouping: false })
}

/** Reads a typed page number, accepting Persian and Arabic digits. NaN when it is not a whole number. */
export function parseTypedPage(value: string): number {
  const latin = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .trim()
  return /^\d{1,6}$/.test(latin) ? Number(latin) : Number.NaN
}
