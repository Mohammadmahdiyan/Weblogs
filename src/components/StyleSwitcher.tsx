import { useEffect, useRef, useState } from 'react'
import { useMatch } from 'react-router-dom'
import { Palette, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { useDismissibleDetails } from '../lib/useDismissibleDetails'
import {
  appearanceGroups,
  applyAppearance,
  defaultAppearance,
  loadAppearance,
  saveAppearance,
  type AppearanceKey,
  type AppearanceSettings,
} from '../lib/appearance'

/**
 * Header menu with small look changes for the article being read: colour palette, accordion,
 * quote and button style. It never changes the page layout. It appears only on /blog/:slug and /books/:slug;
 * the saved choice applies to the whole site and is remembered in this browser.
 */
export function StyleSwitcher() {
  const onBlogArticle = useMatch('/blog/:slug') !== null
  const onBook = useMatch('/books/:slug') !== null
  const onArticle = onBlogArticle || onBook
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [settings, setSettings] = useState<AppearanceSettings>(loadAppearance)

  useEffect(() => applyAppearance(settings), [settings])

  useDismissibleDetails(detailsRef)

  if (!onArticle) return null

  function update(next: AppearanceSettings) {
    saveAppearance(next)
    setSettings(next)
  }

  function pick(key: AppearanceKey, id: string) {
    update({ ...settings, [key]: id })
  }

  const isDefault = appearanceGroups.every((group) => settings[group.key] === defaultAppearance[group.key])

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label="تغییر ظاهر مقاله"
        title="تغییر ظاهر مقاله"
        className="inline-flex size-10 cursor-pointer list-none items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] sm:w-auto sm:px-3 sm:text-sm [&::-webkit-details-marker]:hidden"
      >
        <Palette aria-hidden="true" className="size-5 sm:size-4" />
        <span className="hidden sm:inline">ظاهر</span>
      </summary>
      <div className="absolute end-0 top-full z-10 mt-2 grid w-64 max-w-[calc(100vw-1rem)] gap-4 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-4 text-[var(--text)] shadow-lg">
        {appearanceGroups.map((group) => (
          <div key={group.key} role="group" aria-label={group.label} className="grid gap-2">
            <span className="text-start text-xs font-bold text-[var(--muted)]">{group.label}</span>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = settings[group.key] === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pick(group.key, option.id)}
                    className={clsx(
                      'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs',
                      active
                        ? 'border-[var(--brand)] bg-[var(--surface-strong)] font-bold text-[var(--text)]'
                        : 'border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
                    )}
                  >
                    {option.swatch && <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: option.swatch }} />}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={isDefault}
          onClick={() => update({ ...defaultAppearance })}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] disabled:opacity-50"
        >
          <RotateCcw aria-hidden="true" className="size-3.5" />
          بازگشت به حالت پیش‌فرض
        </button>
      </div>
    </details>
  )
}
