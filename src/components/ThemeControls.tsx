import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { clsx } from 'clsx'
import { ThemeContext, type ThemeMode, useTheme } from '../lib/theme'
import { useFont } from '../lib/font-context'

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
  const { fonts, current, setFont, size, setSize, resetFont } = useFont()
  const showFontSelect = fonts.length > 1

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
      {showFontSelect && (
        <label className="flex items-center gap-1.5">
          <span>خانواده فونت:</span>
          <select
            value={current}
            onChange={(event) => setFont(event.currentTarget.value)}
            aria-label="انتخاب فونت"
            className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
          >
            {fonts.map((font) => (
              <option key={font.id} value={font.id}>{font.label}</option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="کوچک کردن متن"
          onClick={() => setSize(Math.max(80, size - 5))}
          className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] px-2 py-1 text-xs text-[var(--text)] hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
        >
          A−
        </button>
        <input
          type="range"
          min="80"
          max="150"
          step="5"
          value={size}
          aria-label="اندازه متن"
          onChange={(event) => setSize(Number(event.currentTarget.value))}
          className="w-24 cursor-pointer accent-[var(--brand)]"
        />
        <output className="min-w-10 text-center text-xs tabular-nums" aria-label="اندازه فعلی">
          {size}%
        </output>
        <button
          type="button"
          aria-label="بزرگ کردن متن"
          onClick={() => setSize(Math.min(150, size + 5))}
          className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] px-2 py-1 text-xs text-[var(--text)] hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
        >
          A+
        </button>
        <button
          type="button"
          aria-label="بازنشانی فونت و اندازه"
          onClick={resetFont}
          className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
        >
          بازنشانی
        </button>
      </label>
    </div>
  )
}

const styleLabels = [
  { id: 1, label: 'سبزلرن' },
  { id: 2, label: 'مدیوم' },
  { id: 3, label: 'دِو.تو' },
  { id: 4, label: 'استریپ' },
  { id: 5, label: 'مجله' },
  { id: 6, label: 'نوتیون' },
  { id: 7, label: 'گلو' },
  { id: 8, label: 'براتالیست' },
]

export function StylePreviewToggle({ activeStyle }: { activeStyle: number }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="پیش‌نمایش استایل"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
      >
        <Palette aria-hidden="true" className="size-4" />
      </button>
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute start-0 top-full z-10 mt-2 flex flex-wrap gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-2 text-xs shadow-[var(--shadow-card)]"
          role="menu"
          aria-label="پیش‌نمایش استایل‌ها"
        >
          {styleLabels.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              aria-label={`استایل ${id}: ${label}`}
              onClick={() => {
                const params = new URLSearchParams(window.location.search)
                params.set('style', String(id))
                window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className={clsx(
                'rounded-[var(--radius-sm)] px-2 py-1 font-medium transition-colors',
                id === activeStyle
                  ? 'bg-[var(--brand)] text-[var(--brand-contrast)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]',
              )}
            >
              {id}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}