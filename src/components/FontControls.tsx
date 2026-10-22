import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import {
  DEFAULT_FONT_PERCENT,
  FONT_STEP,
  FontContext,
  MAX_FONT_PERCENT,
  MIN_FONT_PERCENT,
  clampFontPercent,
  fallbackRegistry,
  fontStack,
  parseFontRegistry,
  useFont,
  type FontRegistry,
} from '../lib/font'

function readStoredSize(): number {
  try {
    const stored = localStorage.getItem('fontSize')
    return stored === null ? DEFAULT_FONT_PERCENT : clampFontPercent(Number(stored))
  } catch {
    return DEFAULT_FONT_PERCENT
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode); the setting just will not persist.
  }
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<FontRegistry>(fallbackRegistry)
  const [fontId, setFontId] = useState<string | null>(() => readStored('font'))
  const [size, setSizeState] = useState<number>(readStoredSize)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}fonts/fonts.json`, {
      cache: 'no-cache',
      signal: controller.signal,
    })

      .then((response) => (response.ok ? response.json() as Promise<unknown> : null))
      .then((json) => {
        const parsed = parseFontRegistry(json)
        if (parsed) setRegistry(parsed)
      })
      .catch(() => undefined) // Registry is optional: keep the built-in default.
    return () => controller.abort()
  }, [])

  const current = useMemo(
    () => registry.fonts.find((font) => font.id === fontId)
      ?? registry.fonts.find((font) => font.id === registry.default)
      ?? registry.fonts[0],
    [fontId, registry],
  )

  useEffect(() => {
    const stack = fontStack(current)
    const root = document.documentElement
    root.style.setProperty('--app-font-family', stack)
    writeStored('fontStack', stack)
  }, [current])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', String(size / 100))
  }, [size])

  const setFont = useCallback((id: string) => {
    setFontId(id)
    writeStored('font', id)
  }, [])

  const setSize = useCallback((percent: number) => {
    const next = clampFontPercent(percent)
    setSizeState(next)
    writeStored('fontSize', String(next))
  }, [])

  const resetFont = useCallback(() => {
    setFontId(null)
    setSizeState(DEFAULT_FONT_PERCENT)
    writeStored('font', null)
    writeStored('fontSize', null)
    writeStored('fontStack', null)
  }, [])

  const value = useMemo(
    () => ({ fonts: registry.fonts, current, setFont, size, setSize, resetFont }),
    [registry.fonts, current, setFont, size, setSize, resetFont],
  )
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>
}

// Sizes are in px on purpose: this control must keep its size (and fit a phone) however big the text is set.
const buttonClass = 'inline-flex size-[36px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-[var(--info)] disabled:opacity-40'

export function FontControls() {
  const { fonts, current, setFont, size, setSize, resetFont } = useFont()

  return (
    <div role="group" aria-label="تنظیمات فونت" className="inline-flex max-w-full flex-wrap items-center justify-center gap-[12px] text-[14px] leading-[20px] text-[var(--text-secondary)]">
      {fonts.length > 1 && (
        <label className="inline-flex items-center gap-[8px]">
          <span>فونت</span>
          <select
            value={current.id}
            onChange={(event) => setFont(event.currentTarget.value)}
            className="min-h-[36px] max-w-[200px] rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-[8px] text-[14px] text-[var(--text)]"
          >
            {fonts.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
          </select>
        </label>
      )}

      <div className="inline-flex max-w-full items-center gap-[8px]">
        <button type="button" onClick={() => setSize(size - FONT_STEP)} disabled={size <= MIN_FONT_PERCENT} aria-label="کوچک‌کردن متن" title="کوچک‌کردن متن" className={buttonClass}>
          <Minus aria-hidden="true" className="size-[16px]" />
        </button>
        <input
          type="range"
          min={MIN_FONT_PERCENT}
          max={MAX_FONT_PERCENT}
          step={FONT_STEP}
          value={size}
          aria-label="اندازه متن"
          aria-valuetext={`${size} درصد`}
          onChange={(event) => setSize(Number(event.currentTarget.value))}
          className="w-[112px] min-w-0 shrink accent-[var(--brand)]"
        />
        <button type="button" onClick={() => setSize(size + FONT_STEP)} disabled={size >= MAX_FONT_PERCENT} aria-label="بزرگ‌کردن متن" title="بزرگ‌کردن متن" className={buttonClass}>
          <Plus aria-hidden="true" className="size-[16px]" />
        </button>
        <output className="min-w-[44px] text-center tabular-nums" aria-live="polite">{size}٪</output>
      </div>

      <button type="button" onClick={resetFont} aria-label="بازنشانی فونت و اندازه" title="بازنشانی" className={buttonClass}>
        <RotateCcw aria-hidden="true" className="size-[16px]" />
      </button>
    </div>
  )
}
