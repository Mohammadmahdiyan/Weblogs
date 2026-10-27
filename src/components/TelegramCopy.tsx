import { useEffect, type RefObject } from 'react'
import { Copy } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import { copyToClipboard } from '../lib/clipboard'
import { telegramFromMarkdown, telegramPart, type TelegramPartKind, type TelegramPayload } from '../lib/telegram'

const PART_LABEL: Record<TelegramPartKind, string> = { section: 'بخش', quote: 'نقل‌قول' }

async function copy(payload: TelegramPayload, what: string) {
  try {
    if (!payload.text) throw new Error('There is no text to copy.')
    await copyToClipboard(payload)
    toast.success(`${what} با موفقیت کپی شد.`)
  } catch (error) {
    console.error('Copying for Telegram failed:', error)
    toast.error('کپی کردن متن با شکست مواجه شد. دلیلش در کنسول مرورگر نوشته شده است.')
  }
}

/** The outermost quote around an element (a quote inside a quote copies the whole thing). */
function outermostQuote(element: Element): HTMLElement | null {
  let found: HTMLElement | null = null
  for (let quote = element.closest<HTMLElement>('blockquote[data-src]'); quote; quote = quote.parentElement?.closest<HTMLElement>('blockquote[data-src]') ?? null) found = quote
  return found
}

/**
 * Copy for Telegram:
 *  - the button at the end of the article copies the whole article;
 *  - a click on a heading (`##`, `###` …) copies that heading with its whole section (up to the next heading of
 *    the same or a higher level), and a click on a quote copies the quote.
 * The text keeps bold / italic / underline / strike / mono / spoiler / quote / links (HTML for pasting into
 * Telegram, plus Telegram's own markup as plain text).
 */
export function TelegramCopy({ markdown, bodyRef }: { markdown: string; bodyRef: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      // Links, buttons (accordion titles, spoilers, images…) keep their own job, and so does selecting text.
      if (event.target.closest('a, button, summary, input, select, textarea')) return
      if (window.getSelection()?.toString()) return

      const element = event.target.closest<HTMLElement>('h2[data-src], h3[data-src], h4[data-src], h5[data-src], h6[data-src]') ?? outermostQuote(event.target)
      if (!element || !body.contains(element)) return

      try {
        const part = telegramPart(markdown, Number(element.dataset.src))
        if (!part) throw new Error(`No copyable block starts at offset ${element.dataset.src}.`)
        void copy(part.payload, `«${PART_LABEL[part.kind]}»`)
      } catch (error) {
        console.error('Converting the part for Telegram failed:', error)
        toast.error('کپی کردن متن با شکست مواجه شد. دلیلش در کنسول مرورگر نوشته شده است.')
      }
    }

    body.addEventListener('click', onClick)
    return () => body.removeEventListener('click', onClick)
  }, [markdown, bodyRef])

  function copyArticle() {
    try {
      void copy(telegramFromMarkdown(markdown), 'متن مقاله')
    } catch (error) {
      console.error('Converting the article for Telegram failed:', error)
      toast.error('کپی کردن متن با شکست مواجه شد. دلیلش در کنسول مرورگر نوشته شده است.')
    }
  }

  return (
    <>
      <div className="not-prose mt-10 flex justify-center">
        <button
          type="button"
          onClick={copyArticle}
          title="کپی متن مقاله برای تلگرام (با کلیک روی هر عنوان یا نقل‌قول هم فقط همان بخش کپی می‌شود)"
          className="md-button inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]"
        >
          <Copy aria-hidden="true" className="size-4" />
          کپی متن مقاله
        </button>
      </div>
      <ToastContainer position="bottom-center" rtl newestOnTop limit={3} autoClose={4000} />
    </>
  )
}
