/**
 * Small, reader-chosen look changes. They never change the page layout:
 * only the colour palette and the look of accordions, quotes and buttons.
 *
 * The choice is stored in the browser and written as `data-*` attributes on <html>
 * (e.g. `<html data-palette="blue" data-quote="line">`); the CSS for each value lives in
 * `src/styles/theme.css` (palettes) and `src/styles/blog-styles.css` (the rest).
 * `index.html` applies the saved choice before React starts so nothing flashes.
 */

export type AppearanceKey = 'palette' | 'accordion' | 'quote' | 'button'
export type AppearanceSettings = Record<AppearanceKey, string>

export interface AppearanceOption {
  id: string
  label: string
  /** Palette preview colour. */
  swatch?: string
}

export interface AppearanceGroup {
  key: AppearanceKey
  label: string
  options: AppearanceOption[]
}

export const APPEARANCE_STORAGE_KEY = 'blog-appearance'
export const DEFAULT_OPTION = 'default'

export const appearanceGroups: AppearanceGroup[] = [
  {
    key: 'palette',
    label: 'رنگ‌بندی',
    options: [
      { id: 'default', label: 'سبز', swatch: '#15803d' },
      { id: 'blue', label: 'آبی', swatch: '#1d4ed8' },
      { id: 'purple', label: 'بنفش', swatch: '#6d28d9' },
      { id: 'rose', label: 'قرمز', swatch: '#be123c' },
      { id: 'orange', label: 'نارنجی', swatch: '#c2410c' },
      { id: 'teal', label: 'فیروزه‌ای', swatch: '#0f766e' },
      { id: 'graphite', label: 'خاکستری', swatch: '#374151' },
    ],
  },
  {
    key: 'accordion',
    label: 'آکاردئون',
    options: [
      { id: 'default', label: 'پر' },
      { id: 'outline', label: 'کادردار' },
      { id: 'minimal', label: 'ساده' },
    ],
  },
  {
    key: 'quote',
    label: 'نقل‌قول',
    options: [
      { id: 'default', label: 'کارتی' },
      { id: 'line', label: 'خط کناری' },
      { id: 'outline', label: 'کادردار' },
    ],
  },
  {
    key: 'button',
    label: 'دکمه',
    options: [
      { id: 'default', label: 'معمولی' },
      { id: 'pill', label: 'گرد' },
      { id: 'raised', label: 'برجسته' },
    ],
  },
]

export const defaultAppearance: AppearanceSettings = {
  palette: DEFAULT_OPTION,
  accordion: DEFAULT_OPTION,
  quote: DEFAULT_OPTION,
  button: DEFAULT_OPTION,
}

/** Defensive parser: stored JSON can be old, edited or blocked; unknown values fall back to the default. */
export function parseAppearance(value: unknown): AppearanceSettings {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const result = { ...defaultAppearance }
  for (const group of appearanceGroups) {
    const candidate = source[group.key]
    if (typeof candidate === 'string' && group.options.some((option) => option.id === candidate)) {
      result[group.key] = candidate
    }
  }
  return result
}

export function loadAppearance(): AppearanceSettings {
  try {
    return parseAppearance(JSON.parse(window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? 'null'))
  } catch {
    return { ...defaultAppearance }
  }
}

export function saveAppearance(settings: AppearanceSettings): void {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be blocked (private mode); the choice then lasts until the page is closed.
  }
}

/** The default option has no attribute, so the stylesheet's normal look applies. */
export function applyAppearance(settings: AppearanceSettings, root: HTMLElement = document.documentElement): void {
  for (const group of appearanceGroups) {
    const value = settings[group.key]
    if (value === DEFAULT_OPTION) root.removeAttribute(`data-${group.key}`)
    else root.setAttribute(`data-${group.key}`, value)
  }
}
