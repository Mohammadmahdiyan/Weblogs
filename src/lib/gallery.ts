/*
  Gallery layout. Pure functions (unit-tested): the number of items per row for N items.

  At 100% font size:
    1 → no gallery (plain media)      4 → 2 + 2          7 → 3 + 2 + 2
    2 → 1 + 1 (right / left)          5 → 3 + 2          8 → 3 + 3 + 2
    3 → 2 + 1 (the last one is full)  6 → 3 + 3          9 → 3 + 3 + 3 …
  The row size is capped (2 for up to 4 items, 3 for more) and the cap follows the reader's
  font size: bigger text → fewer items per row, smaller text → more. The remaining items are
  spread as evenly as possible, longest rows first.
*/

/** Items per row at 100% font size. */
export function baseColumns(count: number): number {
  return count <= 4 ? 2 : 3
}

/** The row cap for a font size in percent (100 = base). `maxByWidth` is what physically fits. */
export function columnCap(count: number, fontPercent: number, maxByWidth = Number.POSITIVE_INFINITY): number {
  const percent = Number.isFinite(fontPercent) && fontPercent > 0 ? fontPercent : 100
  const scaled = Math.round((baseColumns(count) * 100) / percent)
  return Math.max(1, Math.min(scaled, Math.floor(maxByWidth) || 1, count))
}

/** Row sizes, e.g. `[3, 2]` for 5 items. */
export function galleryRows(count: number, fontPercent = 100, maxByWidth = Number.POSITIVE_INFINITY): number[] {
  if (count <= 0) return []
  const cap = columnCap(count, fontPercent, maxByWidth)
  const rowCount = Math.ceil(count / cap)
  const base = Math.floor(count / rowCount)
  const longer = count % rowCount
  return Array.from({ length: rowCount }, (_, index) => (index < longer ? base + 1 : base))
}
