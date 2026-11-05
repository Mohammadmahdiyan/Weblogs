import { ChevronDown, ExternalLink } from 'lucide-react'
import { classifySource, sourceText, type SourceItem } from '../lib/sources'

/**
 * The article's `sources:` (frontmatter) as one accordion at its end, closed until opened:
 *   منبع ▾   →   [ویدیو یوتیوب]  youtube.com/watch?v=…
 * A picture source also shows a small preview; a source without an address is plain text.
 */
export function SourcesAccordion({ sources }: { sources: SourceItem[] }) {
  if (sources.length === 0) return null

  return (
    <details className="group not-prose mt-8 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-md)] px-4 py-3 text-start text-base font-bold text-[var(--text)] marker:hidden hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)] [&::-webkit-details-marker]:hidden">
        <span>{sources.length > 1 ? `منابع (${sources.length.toLocaleString('fa-IR')})` : 'منبع'}</span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
      </summary>

      <ul className="m-0 grid list-none gap-3 border-t border-[var(--border-light)] p-4">
        {sources.map((source) => {
          const info = classifySource(source)
          return (
            <li key={source.url ?? source.title} className="grid min-w-0 gap-2 text-start">
              {source.url ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[var(--info)] no-underline hover:underline">
                  <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs font-bold text-[var(--text-secondary)]">{info.label}</span>
                  <span dir="auto" className="min-w-0 break-all text-sm">{sourceText(source)}</span>
                  <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 rtl:-scale-x-100" />
                </a>
              ) : (
                <p className="m-0 text-sm leading-7 text-[var(--text)]">{source.title}</p>
              )}
              {source.url && info.kind === 'image' && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" aria-hidden="true" tabIndex={-1} className="justify-self-start">
                  <img src={source.url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="max-h-40 max-w-full rounded-[var(--radius-sm)] border border-[var(--border-light)] object-contain" />
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
