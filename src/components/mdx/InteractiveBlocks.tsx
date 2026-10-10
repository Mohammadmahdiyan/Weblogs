import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'

interface AccordionItemProps {
  title?: string
  open?: boolean | string
  children?: ReactNode
}

interface FaqEntry {
  name: string
  acceptedAnswer: { '@type': string; text: string }
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join(' ')
  if (isValidElement<{ children?: ReactNode; alt?: string }>(node)) {
    return node.props.alt ?? nodeText(node.props.children)
  }
  return ''
}

function faqEntries(children: ReactNode): FaqEntry[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ title?: unknown; children?: ReactNode }>(child)) return []
    const { title, children: answer } = child.props
    const current: FaqEntry[] = typeof title === 'string' && title.trim()
      ? [{
          name: title,
          acceptedAnswer: { '@type': 'Answer', text: nodeText(answer).trim() },
        }]
      : []
    return [...current, ...faqEntries(answer)]
  })
}

export function Accordion({
  faq = false,
  title,
  faqItems,
  children,
}: {
  faq?: boolean | string
  title?: string
  faqItems?: string
  children?: ReactNode
}) {
  const isFaq = faq === true || faq === '' || faq === 'true' || title?.trim() === 'سوالات متداول'
  let parsedFaqItems: { question: string; answer: string }[] | undefined
  if (faqItems) {
    try {
      const parsed: unknown = JSON.parse(faqItems)
      if (Array.isArray(parsed) && parsed.every((item) =>
        typeof item === 'object' && item !== null &&
        'question' in item && typeof item.question === 'string' &&
        'answer' in item && typeof item.answer === 'string'
      )) {
        parsedFaqItems = parsed
      }
    } catch {
      parsedFaqItems = undefined
    }
  }
  const questions = isFaq
    ? [...(parsedFaqItems ?? []), ...faqEntries(children).map((entry) => ({
        question: entry.name,
        answer: entry.acceptedAnswer.text,
      }))]
        .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.question === entry.question) === index)
        .map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        }))
    : []
  const schema = questions.length > 0
    ? JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions }).replace(/</g, '\\u003c')
    : null
  const schemaId = useId()

  useEffect(() => {
    if (!schema) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.faqSchema = schemaId
    script.textContent = schema
    document.head.append(script)
    return () => script.remove()
  }, [schema, schemaId])

  return (
    <div className="not-prose my-5 grid gap-4">
      {children}
    </div>
  )
}

export function AccordionItem({ title = 'جزئیات', open = false, children }: AccordionItemProps) {
  const id = useId().replace(/:/g, '')
  const [expanded, setExpanded] = useState(open === true || open === 'true')
  const triggerId = `accordion-trigger-${id}`
  const panelId = `accordion-panel-${id}`

  return (
    <section className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-alt)]">
      <h3 className="m-0">
        <button
          id={triggerId}
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between gap-3 bg-[var(--surface-strong)] px-4 py-3 text-start text-sm font-semibold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--info)]"
        >
          <span>{title}</span>
          <ChevronDown aria-hidden="true" className={clsx('size-4 shrink-0 transition-transform motion-reduce:transition-none', expanded && 'rotate-180')} />
        </button>
      </h3>
      <div className={clsx('grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none', expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            aria-hidden={!expanded}
            ref={(element) => {
              if (element) element.inert = !expanded
            }}
            className="px-4 py-3 text-start text-sm leading-6 text-[var(--text-muted)]"
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Modal({
  trigger = 'نمایش',
  title = 'جزئیات',
  children,
}: {
  trigger?: string
  title?: string
  children?: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close()
  }

  return (
    <div className="not-prose my-2 inline-block">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="min-h-10 rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]"
      >
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault()
          closeDialog()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeDialog()
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog()
        }}
        className="m-auto max-h-[85vh] w-[min(92vw,40rem)] rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-0 text-[var(--text)] backdrop:bg-[color-mix(in_srgb,var(--text)_55%,transparent)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-light)] px-5 py-4">
          <h2 id={titleId} className="m-0 text-start text-lg font-semibold">{title}</h2>
          <button type="button" onClick={closeDialog} aria-label="بستن پنجره" className="rounded-[var(--radius-sm)] p-2 text-[var(--text-muted)] hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="p-5 text-start text-sm leading-7">{children}</div>
      </dialog>
    </div>
  )
}