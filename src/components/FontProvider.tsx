import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FontContext, type FontConfig } from '../lib/font-context'

const defaultFontConfig: FontConfig = {
  id: 'vazirmatn',
  label: 'وزیرمتن',
  family: 'Vazirmatn',
  fallback: 'Tahoma, system-ui, sans-serif',
}

const defaultFontsJson = {
  default: 'vazirmatn',
  fonts: [defaultFontConfig],
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [fonts, setFonts] = useState<FontConfig[]>([defaultFontConfig])
  const [current, setCurrent] = useState(() => localStorage.getItem('font') || 'vazirmatn')
  const [size, setSizeState] = useState(() => {
    const stored = localStorage.getItem('fontSize')
    const parsed = stored ? Number.parseFloat(stored) : 100
    return Math.min(150, Math.max(80, parsed))
  })

  useEffect(() => {
    let cancelled = false

    fetch('/fonts/fonts.json', { cache: 'no-cache' })
      .then((response) => response.ok ? response.json() : defaultFontsJson)
      .then((data: { default?: string; fonts?: FontConfig[] }) => {
        if (!cancelled) {
          const loadedFonts = data.fonts && data.fonts.length > 0 ? data.fonts : [defaultFontConfig]
          setFonts(loadedFonts)
          const defaultId = data.default || 'vazirmatn'
          if (!loadedFonts.find((font) => font.id === current) && current !== defaultId) {
            setCurrent(defaultId)
          }
          localStorage.setItem('fonts-default', JSON.stringify(defaultId))
        }
      })
      .catch(() => {
        if (!cancelled) setFonts([defaultFontConfig])
      })

    return () => { cancelled = true }
  }, [current])

  useEffect(() => {
    const font = fonts.find((font) => font.id === current)
    if (!font) return

    const family = `"${font.family}", ${font.fallback}`
    document.documentElement.style.setProperty('--app-font-family', family)
    localStorage.setItem('font', current)
  }, [current, fonts])

  useEffect(() => {
    const scale = size / 100
    document.documentElement.style.setProperty('--app-font-scale', String(scale))
    localStorage.setItem('fontSize', String(size))
  }, [size])

  const value = useMemo(() => ({
    fonts,
    current,
    setFont: (fontId: string) => {
      localStorage.setItem('font', fontId)
      setCurrent(fontId)
    },
    size,
    setSize: (nextSize: number) => {
      setSizeState(Math.min(150, Math.max(80, nextSize)))
    },
    resetFont: () => {
      const defaultId = JSON.parse(localStorage.getItem('fonts-default') || '"vazirmatn"') as string
      localStorage.setItem('font', defaultId)
      setCurrent(defaultId)
      setSizeState(100)
    },
  }), [fonts, current, size])

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>
}
