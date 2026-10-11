import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'

type Grade = 'sahih' | 'hasan' | 'daif' | 'mawdu' | 'unknown'

const grades: Record<Grade, { label: string; accent: string; badge: string }> = {
  sahih: { label: 'صحیح', accent: 'border-[var(--success)]', badge: 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]' },
  hasan: { label: 'حسن', accent: 'border-[var(--info)]', badge: 'bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[var(--info)]' },
  daif: { label: 'ضعیف', accent: 'border-[var(--warn)]', badge: 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-[var(--warn)]' },
  mawdu: { label: 'موضوع', accent: 'border-[var(--danger)]', badge: 'bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]' },
  unknown: { label: 'نامشخص', accent: 'border-[var(--border-strong)]', badge: 'bg-[var(--surface-strong)] text-[var(--text-secondary)]' },
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
    <figure className={clsx('not-prose my-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-light)] border-s-4 bg-[var(--surface-alt)] text-[var(--text)]', level.accent)}>
      {(site || title || isGrade(grade)) && (
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-light)] px-4 py-3 text-start">
          <span className="min-w-0 text-sm">
            {site && <span className="font-bold">{site}</span>}
            {site && title && <span aria-hidden="true" className="mx-2 text-[var(--muted)]">·</span>}
            {title && <span className="text-[var(--text-secondary)]">{title}</span>}
          </span>
          {isGrade(grade) && <span className={clsx('rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-bold', level.badge)}>{level.label}</span>}
        </figcaption>
      )}
      <blockquote lang={lang} dir={textDirection} className="m-0 px-4 py-4 text-start text-base leading-9 [&_p]:my-2">
        {children}
      </blockquote>
      {(reference || safeUrl) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-light)] px-4 py-2 text-xs text-[var(--text-secondary)]">
          {reference ? <cite className="not-italic">{reference}</cite> : <span />}
          {safeUrl && (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--info)] no-underline hover:underline">
              مشاهده در منبع
              <ArrowRight aria-hidden="true" className="size-3.5 rtl:rotate-180" />
            </a>
          )}
        </div>
      )}
    </figure>
  )
}
