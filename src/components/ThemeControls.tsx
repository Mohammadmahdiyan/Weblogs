import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { clsx } from 'clsx'
import { ThemeContext, type ThemeMode, useTheme } from '../lib/theme'

function applyTheme(theme: ThemeMode, systemDark: boolean) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = theme === 'system' ? 'light dark' : theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => applyTheme(theme, media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [theme])

  function setTheme(nextTheme: ThemeMode) {
    localStorage.setItem('theme', nextTheme)
    setThemeState(nextTheme)
  }

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const themeOptions: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'روشن', Icon: Sun },
  { value: 'dark', label: 'تیره', Icon: Moon },
  { value: 'system', label: 'سیستم', Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="group" aria-label="انتخاب پوسته" className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] p-1">
      {themeOptions.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className={clsx('inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--info)]', theme === value && 'bg-[var(--surface)] text-[var(--brand)]')}
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
  )
}

export function FontControls() {
  const [size, setSize] = useState(() => Number(localStorage.getItem('font-size') ?? '16'))

  useEffect(() => {
    document.documentElement.style.setProperty('--prose-size', `${size}px`)
    localStorage.setItem('font-size', String(size))
  }, [size])

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <span>اندازه متن</span>
      <input type="range" min="14" max="22" step="1" value={size} aria-label="اندازه متن مقاله" onChange={(event) => setSize(Number(event.currentTarget.value))} className="w-24 accent-[var(--brand)]" />
      <output className="min-w-8 text-center tabular-nums">{size}</output>
    </label>
  )
}