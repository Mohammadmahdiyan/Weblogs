import { createContext, useContext } from 'react'

export interface FontEntry {
  id: string
  label: string
  family: string
  fallback: string
}

export interface FontRegistry {
  default: string
  fonts: FontEntry[]
}

export const MIN_FONT_PERCENT = 80
export const MAX_FONT_PERCENT = 150
export const FONT_STEP = 5
export const DEFAULT_FONT_PERCENT = 100

/** Used when /fonts/fonts.json cannot be loaded. Mirrors the shipped registry. */
export const fallbackRegistry: FontRegistry = {
  default: 'vazir',
  fonts: [{ id: 'vazir', label: 'وزیر', family: 'Vazir', fallback: 'Tahoma, system-ui, sans-serif' }],
}

export function fontStack(font: FontEntry): string {
  const family = /\s/.test(font.family) ? `"${font.family}"` : font.family
  return font.fallback ? `${family}, ${font.fallback}` : family
}

export function clampFontPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FONT_PERCENT
  const snapped = Math.round(value / FONT_STEP) * FONT_STEP
  return Math.min(MAX_FONT_PERCENT, Math.max(MIN_FONT_PERCENT, snapped))
}

/** Defensive parser: the registry is user-edited JSON, never trust its shape. */
export function parseFontRegistry(value: unknown): FontRegistry | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as { default?: unknown; fonts?: unknown }
  if (!Array.isArray(candidate.fonts)) return null
  const fonts: FontEntry[] = []
  for (const item of candidate.fonts) {
    if (typeof item !== 'object' || item === null) continue
    const entry = item as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.family !== 'string') continue
    fonts.push({
      id: entry.id,
      label: typeof entry.label === 'string' ? entry.label : entry.family,
      family: entry.family,
      fallback: typeof entry.fallback === 'string' ? entry.fallback : 'system-ui, sans-serif',
    })
  }
  if (fonts.length === 0) return null
  const defaultId = typeof candidate.default === 'string' && fonts.some((font) => font.id === candidate.default)
    ? candidate.default
    : fonts[0].id
  return { default: defaultId, fonts }
}

export interface FontContextValue {
  fonts: FontEntry[]
  current: FontEntry
  setFont: (id: string) => void
  size: number
  setSize: (percent: number) => void
  resetFont: () => void
}

const fallbackFont = fallbackRegistry.fonts[0]

export const FontContext = createContext<FontContextValue>({
  fonts: fallbackRegistry.fonts,
  current: fallbackFont,
  setFont: () => undefined,
  size: DEFAULT_FONT_PERCENT,
  setSize: () => undefined,
  resetFont: () => undefined,
})

export function useFont(): FontContextValue {
  return useContext(FontContext)
}
