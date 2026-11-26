import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Code, Copy, Send } from 'lucide-react'
import { toast } from 'react-toastify'
import { copyToClipboard } from '../lib/clipboard'
import { describeRange } from '../lib/findInPage'
import { isLongSelection, linkLabel, markdownLink, telegramLinkPayload, textLinkUrl } from '../lib/textLink'

type Action = 'telegram' | 'markdown' | 'plain'

interface MenuState {
  /** The selected text, as the browser gave it. */
  selected: string
  /** Page coordinates of the menu's top centre (just under the selection). */
  top: number
  centre: number
}

const MENU_WIDTH = 304
const EDGE = 8
const GAP = 10
/** After a tap inside the menu the browser may collapse the selection; the menu ignores that for a moment. */
const HOLD_MS = 1200

const squash = (value: string) => value.replace(/\s+/g, ' ').trim()

/**
 * A small box under the text the reader selects (mouse or touch) inside the article:
 *  1. copy the plain text;
 *  2. copy for Telegram as a link: the text becomes a link to this very place in this page;
 *  3. copy the same link as Markdown: `[text](link)`.
 * A long selection is shown shortened with "..." in the link text; the switch next to options 2 and 3 (shown only
 * for a long selection) puts the whole text in the link instead. The link itself always leads to the whole passage.
 */
export function SelectionCopyMenu({ bodyRef, articleUrl }: { bodyRef: RefObject<HTMLElement | null>; articleUrl: string }) {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [fullText, setFullText] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<Range | null>(null)
  const pointerDown = useRef(false)
  const holdUntil = useRef(0)

  const hide = useCallback(() => {
    rangeRef.current = null
    setMenu(null)
    setFullText(false)
  }, [])

  useEffect(() => {
    let timer = 0

    const update = () => {
      if (pointerDown.current) return
      const body = bodyRef.current
      const selection = window.getSelection()
      if (!body || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
        if (Date.now() >= holdUntil.current) hide()
        return
      }
      const range = selection.getRangeAt(0)
      const selected = selection.toString()
      // Only text that lies wholly inside the article body gets the menu.
      if (!body.contains(range.commonAncestorContainer) || squash(selected).length < 2) {
        if (Date.now() >= holdUntil.current) hide()
        return
      }
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0)
      const rect = rects[rects.length - 1] ?? range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      const viewport = document.documentElement.clientWidth
      const half = Math.min(MENU_WIDTH, viewport - EDGE * 2) / 2
      const centre = Math.min(Math.max(rect.left + rect.width / 2, EDGE + half), viewport - EDGE - half)
      rangeRef.current = range.cloneRange()
      setMenu({ selected, top: rect.bottom + window.scrollY + GAP, centre: centre + window.scrollX })
    }

    const schedule = (delay: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(update, delay)
    }

    const onSelectionChange = () => schedule(250)
    // Mouse: wait for the button to be released, so the box does not follow the drag. A touch needs no such
    // tracking: the selection handles do not send page events, and `selectionchange` already settles (debounced).
    const onMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return
      pointerDown.current = true
      // A new selection starts: the old box goes away until the new one is made.
      if (Date.now() >= holdUntil.current) hide()
    }
    const onMouseUp = (event: MouseEvent) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return
      pointerDown.current = false
      schedule(30)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }

    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onSelectionChange)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onSelectionChange)
    }
  }, [bodyRef, hide])

  async function run(action: Action) {
    const body = bodyRef.current
    const range = rangeRef.current
    const selected = menu?.selected ?? ''
    const text = selected.trim()
    try {
      if (!text) throw new Error('There is no selected text to copy.')
      if (action === 'plain') {
        await copyToClipboard({ html: '', text })
        toast.success('متن با موفقیت کپی شد.')
      } else {
        const anchor = body && range ? describeRange(body, range) : null
        if (!anchor) throw new Error('The selected text could not be located in the article.')
        const url = textLinkUrl(articleUrl, anchor)
        const label = linkLabel(selected, fullText)
        if (action === 'telegram') {
          await copyToClipboard(telegramLinkPayload(label, url))
          toast.success('متن به‌صورت لینک (برای تلگرام) کپی شد.')
        } else {
          await copyToClipboard({ html: '', text: markdownLink(label, url) })
          toast.success('لینک مارک‌داون کپی شد.')
        }
      }
      window.getSelection()?.removeAllRanges()
      hide()
    } catch (error) {
      console.error('Copying the selected text failed:', error)
      toast.error('کپی کردن متن با شکست مواجه شد. دلیلش در کنسول مرورگر نوشته شده است.')
    }
  }

  if (!menu) return null
  const long = isLongSelection(menu.selected)

  return createPortal(
    <div
      ref={menuRef}
      role="dialog"
      dir="rtl"
      aria-label="کپی متن انتخاب‌شده"
      className="selection-menu"
      style={{ top: menu.top, left: menu.centre }}
      // Taps inside the box must not start a new selection or lose the current one.
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={() => {
        holdUntil.current = Date.now() + HOLD_MS
      }}
    >
      <div className="selection-menu-grid" data-long={long}>
        <button type="button" className="selection-menu-item selection-menu-plain" onClick={() => void run('plain')}>
          <Copy aria-hidden="true" className="size-4" />
          کپی متن عادی
        </button>
        <button type="button" className="selection-menu-item" style={{ gridRow: 2 }} onClick={() => void run('telegram')}>
          <Send aria-hidden="true" className="size-4" />
          کپی برای تلگرام (لینک)
        </button>
        <button type="button" className="selection-menu-item" style={{ gridRow: 3 }} onClick={() => void run('markdown')}>
          <Code aria-hidden="true" className="size-4" />
          کپی کد مارک‌داون
        </button>
        {long && (
          <button
            type="button"
            role="switch"
            aria-checked={fullText}
            className="selection-menu-switch"
            title="اگر روشن باشد، متن کامل در لینک نوشته می‌شود، نه با سه‌نقطه"
            onClick={() => setFullText((value) => !value)}
          >
            <span className="selection-menu-switch-track" aria-hidden="true">
              <span className="selection-menu-switch-thumb" />
            </span>
            <span>متن کامل</span>
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
