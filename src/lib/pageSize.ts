/**
 * Items on one page of the article / book list. Always exactly two rows, whatever the screen:
 * 3 columns × 2 rows = 6 on a wide screen (≥1024px), 2 × 2 = 4 on a medium one (≥640px), 1 × 2 = 2 on a phone.
 * The breakpoints match the grid classes in HomePage.
 */
export function pageSizeFor(wide: boolean, medium: boolean): number {
  return wide ? 6 : medium ? 4 : 2
}
