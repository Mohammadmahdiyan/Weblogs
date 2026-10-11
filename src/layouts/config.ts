export type LayoutColumns = 'main-side' | 'single' | 'toc-main' | 'nav-main-toc'

export interface LayoutConfig {
  id: number
  name: string
  columns: LayoutColumns
  /** `inline` = box inside the article card; `side` = sticky side column with scroll-spy. */
  tocMode: 'inline' | 'side'
  /** Tailwind max-width class for the page container. */
  maxWidth: string
  /** Decorative reactions row below the article (Medium-like). */
  reactions?: boolean
}

export const layouts: Record<number, LayoutConfig> = {
  1: { id: 1, name: 'آموزشی (سبزلرن)', columns: 'main-side', tocMode: 'inline', maxWidth: 'max-w-7xl' },
  2: { id: 2, name: 'مینیمال (Medium)', columns: 'single', tocMode: 'inline', maxWidth: 'max-w-[46rem]', reactions: true },
  3: { id: 3, name: 'توسعه‌دهنده (Dev.to)', columns: 'toc-main', tocMode: 'side', maxWidth: 'max-w-6xl' },
  4: { id: 4, name: 'مستندات (Stripe)', columns: 'nav-main-toc', tocMode: 'side', maxWidth: 'max-w-7xl' },
  5: { id: 5, name: 'مجله (Editorial)', columns: 'single', tocMode: 'inline', maxWidth: 'max-w-[56rem]' },
  6: { id: 6, name: 'یادداشت (Notion)', columns: 'single', tocMode: 'inline', maxWidth: 'max-w-[58rem]' },
  7: { id: 7, name: 'شیشه‌ای (Glass)', columns: 'main-side', tocMode: 'inline', maxWidth: 'max-w-7xl' },
  8: { id: 8, name: 'کنتراست بالا', columns: 'main-side', tocMode: 'inline', maxWidth: 'max-w-7xl' },
}

export const STYLE_IDS = Object.keys(layouts).map(Number)

export function normalizeStyle(style: number | undefined): number {
  return style !== undefined && Number.isInteger(style) && style in layouts ? style : 1
}

export function getLayout(style: number | undefined): LayoutConfig {
  return layouts[normalizeStyle(style)]
}
