import type { ReactNode } from 'react'
import { ExternalLink, Quote } from 'lucide-react'
import { clsx } from 'clsx'

type Grade = 'sahih' | 'hasan' | 'daif' | 'mawdu' | 'unknown'

const grades: Record<Grade, { label: string; accent: string; badge: string }> = {
  sahih: {
    label: 'صحیح',
    accent: 'border-[var(--success)]',
    badge: 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]',
  },
  hasan: {
    label: 'حسن',
    accent: 'border-[var(--info)]',
    badge: 'bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[var(--info)]',
  },
  daif: {
    label: 'ضعیف',
    accent: 'border-[var(--warn)]',
    badge: 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-[var(--warn)]',
  },
  mawdu: {
    label: 'موضوع',
    accent: 'border-[var(--danger)]',
    badge: 'bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]',
  },
  unknown: {
    label: 'نامشخص',
    accent: 'border-[var(--border-strong)]',
    badge: 'bg-[var(--surface-strong)] text-[var(--text-secondary)]',
  },
}

function isGrade(value: string | undefined): value is Grade {
  return value !== undefined && value in grades
}

export interface SourceProps {
  title?: string
  url?: string
  site?: string
  /** Book / hadith number. (`ref` in markdown; renamed because `ref` is reserved by React.) */
  reference?: string
  grade?: string
  lang?: string
  dir?: string
  children?: ReactNode
}

/**
 * Quote card for citing a text from another website (e.g. a hadith and its ruling).
 * Unlike an iframe the text is accessible, indexable and printable.
 */
export function Source({ title, url, site, reference, grade, lang, dir, children }: SourceProps) {
  const level = grades[isGrade(grade) ? grade : 'unknown']
  const safeUrl = url && /^https?:\/\//i.test(url) ? url : undefined
  const textDirection = dir === 'ltr' || dir === 'rtl' ? dir : undefined

  return (
    <figure
      className={clsx(
        'md-source-card not-prose my-7 overflow-hidden rounded-[var(--radius-card)] border border-s-4 border-[var(--border-light)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-card)]',
        level.accent,
      )}
    >
      {(site || title || isGrade(grade)) && (
        <figcaption className="md-source-heading flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] bg-[var(--surface-alt)] px-4 py-3 text-start">
          <span className="flex min-w-0 items-center gap-2.5 text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--brand)] shadow-sm">
              <Quote aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
              {site && <span className="block truncate font-bold text-[var(--text)]">{site}</span>}
              {title && <span className="block truncate text-xs text-[var(--text-secondary)]">{title}</span>}
            </span>
          </span>
          {isGrade(grade) && (
            <span className={clsx('shrink-0 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-bold', level.badge)}>
              {level.label}
            </span>
          )}
        </figcaption>
      )}
      <blockquote
        lang={lang}
        dir={textDirection}
        className="md-source-quote relative m-0 px-5 py-5 text-start text-base leading-9 [&_p]:my-2"
      >
        <Quote
          aria-hidden="true"
          className="md-source-mark pointer-events-none absolute end-3 top-2 size-8 rotate-180 text-[var(--brand)] opacity-10"
        />
        {children}
      </blockquote>
      {(reference || safeUrl) && (
        <div className="md-source-footer flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-light)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          {reference ? (
            <cite className="rounded-full bg-[var(--surface-alt)] px-3 py-1.5 font-semibold not-italic">
              {reference}
            </cite>
          ) : (
            <span />
          )}
          {safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 font-semibold text-[var(--info)] no-underline transition-colors hover:bg-[var(--surface-alt)]"
            >
              مشاهده در منبع
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </div>
      )}
    </figure>
  )
}
