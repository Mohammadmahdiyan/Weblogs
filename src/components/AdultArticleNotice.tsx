import { ShieldAlert } from 'lucide-react'

export function AdultArticleNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-1' : 'min-h-36 flex-col justify-center px-4 py-6 text-center'}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/10 text-[var(--brand)]">
        <ShieldAlert aria-hidden="true" className="size-5" />
      </span>
      <span className={compact ? 'min-w-0' : 'max-w-sm'}>
        <strong className="block text-sm font-bold">حاوی جملات +۱۸</strong>
        <span className="mt-1 block text-xs leading-6 text-[var(--text-secondary)]">
          برای مشاهدهٔ این محتوا، تأیید سن لازم است.
        </span>
      </span>
    </div>
  )
}
