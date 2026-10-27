import { useCallback, useEffect, useState, type RefObject } from 'react'
import { Copy, MousePointerClick, Send, X } from 'lucide-react'
import { clsx } from 'clsx'
import { ToastContainer, toast } from 'react-toastify'
import { copyToClipboard } from '../lib/clipboard'
import { telegramFromMarkdown, telegramPart, type TelegramPartKind, type TelegramPayload } from '../lib/telegram'

type CopyFormat = 'rich' | 'text'
type NoticeKind = 'success' | 'error' | 'info'

/** The message shown after a copy (react-toastify). Change it here to change every message. */
const notify = (kind: NoticeKind, text: string) => toast(text, { type: kind })

const KIND_LABEL: Record<TelegramPartKind, string> = {
  section: 'بخش', quote: 'نقل‌قول', list: 'فهرست', table: 'جدول', accordion: 'آکاردئون', text: 'متن',
}

/**
 * The block a click in «کپی بخش‌به‌بخش» mode refers to: a heading (→ its whole section), else a quote, else a list,
 * else the paragraph / table / accordion item itself. Only blocks that carry `data-src` can be picked.
 */
function resolvePick(target: Element, body: HTMLElement): HTMLElement | null {
  const chain: HTMLElement[] = []
  for (let element: Element | null = target; element && element !== body; element = element.parentElement) {
    if (element instanceof HTMLElement && element.dataset.src !== undefined) chain.push(element)
  }
  if (chain.length === 0) {
    // The link icon next to a heading sits outside the heading element.
    const fromHeading = target.closest('.group')?.querySelector<HTMLElement>('h2[data-src], h3[data-src], h4[data-src], h5[data-src], h6[data-src]')
    return fromHeading ?? null
  }
  const outermost = (tags: string[]) => [...chain].reverse().find((element) => tags.includes(element.tagName))
  return chain.find((element) => /^H[2-6]$/.test(element.tagName)) ?? outermost(['BLOCKQUOTE']) ?? outermost(['UL', 'OL']) ?? chain[0]
}

/**
 * One box at the end of the article:
 *  - «کپی کل مقاله»: the whole article as Telegram-ready text (bold, italic, underline, strike, mono, spoiler,
 *    quote and links), and
 *  - «کپی بخش‌به‌بخش»: a mode in which a click on a heading copies its section, and a click on a quote / paragraph /
 *    list / accordion copies just that. While the mode is on, clicks do not trigger accordions, images or modals,
 *    so no extra buttons are needed inside the article.
 */
export function TelegramCopy({ markdown, bodyRef }: { markdown: string; bodyRef: RefObject<HTMLElement | null> }) {
  const [format, setFormat] = useState<CopyFormat>('rich')
  const [picking, setPicking] = useState(false)

  const copy = useCallback(async (payload: TelegramPayload, what: string) => {
    try {
      await copyToClipboard(format === 'rich' ? payload : { html: '', text: payload.text })
      notify('success', `${what} با موفقیت کپی شد. حالا در تلگرام پیست کن.`)
    } catch (error) {
      console.error('Copying for Telegram failed:', error)
      notify('error', 'کپی کردن متن با شکست مواجه شد. جزئیات خطا در کنسول مرورگر نوشته شده است.')
    }
  }, [format])

  function copyAll() {
    try {
      const payload = telegramFromMarkdown(markdown)
      if (!payload.text) throw new Error('The article has no text to copy.')
      void copy(payload, 'متن مقاله')
    } catch (error) {
      console.error('Converting the article for Telegram failed:', error)
      notify('error', 'کپی کردن متن با شکست مواجه شد. جزئیات خطا در کنسول مرورگر نوشته شده است.')
    }
  }

  useEffect(() => {
    const body = bodyRef.current
    if (!picking || !body) return
    body.setAttribute('data-copy-mode', '')
    let highlighted: HTMLElement | null = null
    const highlight = (element: HTMLElement | null) => {
      if (highlighted === element) return
      highlighted?.removeAttribute('data-copy-target')
      element?.setAttribute('data-copy-target', '')
      highlighted = element
    }

    const onOver = (event: MouseEvent) => highlight(event.target instanceof Element ? resolvePick(event.target, body) : null)
    const onLeave = () => highlight(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPicking(false)
    }
    // Capture phase on the document: runs before React, so accordions / images / modals / spoilers do not react.
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !body.contains(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      const element = resolvePick(event.target, body)
      const offset = Number(element?.dataset.src)
      if (!element || !Number.isFinite(offset)) {
        notify('info', 'این قسمت جداگانه کپی نمی‌شود؛ روی یک عنوان، پاراگراف، نقل‌قول یا فهرست کلیک کن.')
        return
      }
      try {
        const part = telegramPart(markdown, offset)
        if (!part) throw new Error(`No copyable block starts at offset ${offset}.`)
        void copy(part.payload, `«${KIND_LABEL[part.kind]}»`)
      } catch (error) {
        console.error('Converting the part for Telegram failed:', error)
        notify('error', 'کپی کردن متن با شکست مواجه شد. جزئیات خطا در کنسول مرورگر نوشته شده است.')
      }
    }

    document.addEventListener('click', onClick, true)
    body.addEventListener('mouseover', onOver)
    body.addEventListener('mouseleave', onLeave)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick, true)
      body.removeEventListener('mouseover', onOver)
      body.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('keydown', onKey)
      highlight(null)
      body.removeAttribute('data-copy-mode')
    }
  }, [picking, markdown, bodyRef, copy])

  const buttonClass = 'md-button inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]'

  return (
    <>
      <section aria-labelledby="telegram-copy-title" className="surface-card not-prose mt-10 p-4 text-start sm:p-5">
        <h2 id="telegram-copy-title" className="m-0 flex items-center gap-2 text-base font-bold">
          <Send aria-hidden="true" className="size-5 text-[var(--brand)] rtl:-scale-x-100" />
          کپی متن برای تلگرام
        </h2>
        <p className="mb-3 mt-2 text-sm leading-7 text-[var(--text-secondary)]">
          متن مقاله با قالب تلگرام (بولد، ایتالیک، اسپویلر، نقل‌قول، لینک و …) کپی می‌شود. «کپی بخش‌به‌بخش» را بزن و روی هر عنوان، نقل‌قول یا پاراگراف کلیک کن تا فقط همان بخش کپی شود.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copyAll} className={clsx(buttonClass, 'bg-[var(--brand)] text-[var(--brand-foreground)]')}>
            <Copy aria-hidden="true" className="size-4" />
            کپی کل مقاله
          </button>
          <button
            type="button"
            aria-pressed={picking}
            onClick={() => setPicking((value) => !value)}
            className={clsx(buttonClass, picking ? 'bg-[var(--info)] text-[var(--brand-foreground)]' : 'bg-[var(--surface-strong)] text-[var(--text)]')}
          >
            <MousePointerClick aria-hidden="true" className="size-4" />
            کپی بخش‌به‌بخش
          </button>
          <label className="ms-auto flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            نوع کپی
            <select value={format} onChange={(event) => setFormat(event.target.value as CopyFormat)} className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]">
              <option value="rich">قالب‌دار (پیشنهادی)</option>
              <option value="text">متن با علامت‌های تلگرام (**بولد**)</option>
            </select>
          </label>
        </div>
      </section>

      <ToastContainer position="bottom-center" rtl newestOnTop limit={3} autoClose={4000} theme="colored" />

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
        {picking && (
          <div role="status" className="surface-card pointer-events-auto flex max-w-md items-center gap-3 px-4 py-3 text-sm shadow-lg">
            <span>روی عنوان، نقل‌قول، پاراگراف، فهرست یا آکاردئون کلیک کن تا کپی شود.</span>
            <button type="button" onClick={() => setPicking(false)} className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 font-semibold text-[var(--brand)] hover:bg-[var(--surface-alt)]">
              <X aria-hidden="true" className="size-4" />
              پایان
            </button>
          </div>
        )}
      </div>
    </>
  )
}
