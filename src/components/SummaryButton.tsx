import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { copyToClipboard } from '../lib/clipboard'
import {
  buildSummaryPrompt,
  prefillsPrompt,
  readSummaryAi,
  saveSummaryAi,
  summaryAiAddress,
  summaryAis,
  type SummaryAi,
  type SummaryAiId,
  type SummaryKind,
} from '../lib/summaryAi'
import { AiIcon } from './AiIcons'

/**
 * «بده هوش مصنوعی برام خلاصش کنه». The first click asks which assistant the reader prefers and remembers it; after
 * that the button carries that assistant's mark, with an × that asks again. Choosing runs the summary at once,
 * except when it was asked for through the ×: that only changes the preferred assistant.
 */
export function SummaryButton({ url, kind }: { url: string; kind: SummaryKind }) {
  const [choice, setChoice] = useState<SummaryAi | undefined>(() => readSummaryAi())
  const [picker, setPicker] = useState<'first' | 'change' | null>(null)

  function run(ai: SummaryAi) {
    const prompt = buildSummaryPrompt(url, kind)
    // Both happen inside the click, so the browser lets the new tab open: the copy is started, not awaited.
    const copied = copyToClipboard({ html: '', text: prompt })
    window.open(summaryAiAddress(ai, prompt), '_blank', 'noopener,noreferrer')
    copied.then(
      () =>
        toast.success(
          prefillsPrompt(ai, prompt)
            ? `«${ai.name}» باز شد. اگر پراپمت در کادر نیامد، پیست کن (Ctrl+V).`
            : `پراپمت کپی شد؛ در «${ai.name}» پیست کن (Ctrl+V) و بفرست.`,
        ),
      () => toast.error('کپی کردن پراپمت با شکست مواجه شد.'),
    )
  }

  function choose(id: SummaryAiId) {
    const ai = summaryAis.find((item) => item.id === id)
    if (!ai) return
    saveSummaryAi(id)
    setChoice(ai)
    const runNow = picker === 'first'
    setPicker(null)
    if (runNow) run(ai)
  }

  return (
    <>
      <div className="summary-ai inline-flex max-w-full items-stretch overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text)]">
        <button
          type="button"
          onClick={() => (choice ? run(choice) : setPicker('first'))}
          className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2 font-medium hover:bg-[var(--surface-alt)]"
        >
          <Sparkles aria-hidden="true" className="size-4 text-[var(--brand)]" />
          بده هوش مصنوعی برام خلاصش کنه
          {choice && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]" title={choice.name}>
              <AiIcon id={choice.id} className="size-5" />
              <span className="sr-only">{choice.name}</span>
            </span>
          )}
        </button>
        {choice && (
          <button
            type="button"
            onClick={() => setPicker('change')}
            aria-label="تغییر هوش مصنوعی"
            title="تغییر هوش مصنوعی"
            className="inline-flex cursor-pointer items-center border-0 border-s border-[var(--border-light)] bg-transparent px-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      {picker && <AiPicker current={choice?.id} onChoose={choose} onClose={() => setPicker(null)} />}
    </>
  )
}

function AiPicker({
  current,
  onChoose,
  onClose,
}: {
  current: SummaryAiId | undefined
  onChoose: (id: SummaryAiId) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.current?.querySelector<HTMLElement>('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-ai-title"
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--border-light)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-[var(--shadow-card)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="summary-ai-title" className="m-0 text-base font-bold leading-7">
            کدوم هوش مصنوعی رو ترجیح میدی برات خلاصه کنه؟
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="cursor-pointer rounded-[var(--radius-sm)] border-0 bg-transparent p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
          {summaryAis.map((ai) => (
            <li key={ai.id}>
              <button
                type="button"
                onClick={() => onChoose(ai.id)}
                aria-current={ai.id === current ? 'true' : undefined}
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] px-2 py-4 text-sm font-medium text-[var(--text)] hover:border-[var(--brand)] hover:bg-[var(--surface-alt)] aria-[current=true]:border-[var(--brand)]"
              >
                <AiIcon id={ai.id} className="size-8" />
                {ai.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
