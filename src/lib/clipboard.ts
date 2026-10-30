export interface ClipboardPayload {
  html: string
  text: string
}

/**
 * Phones and tablets. Telegram on these devices pastes only the plain half of the clipboard (it ignores the HTML
 * half), so what is copied there must read well as plain text.
 */
export function isTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  // iPadOS reports itself as a Mac, but has touch points.
  return coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Copy that works without the async Clipboard API (plain http such as a phone opening the dev server over Wi-Fi,
 * older browsers, iOS quirks). The formatted text is selected inside a hidden element and copied with the
 * browser's own copy command, which puts HTML and plain text on the clipboard together. Throws when refused.
 */
function legacyCopy({ html, text }: ClipboardPayload): void {
  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/html', html)
    event.clipboardData?.setData('text/plain', text)
    event.preventDefault()
  }
  const selection = window.getSelection()
  const savedRanges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index)) : []
  const hold = (element: HTMLElement) => {
    // font-size 16px stops iOS from zooming the page; it must be selectable and rendered (opacity, not display:none).
    element.style.cssText = 'position:fixed;top:0;inset-inline-start:0;width:1px;height:1px;opacity:0;font-size:16px;white-space:pre-wrap;user-select:text;-webkit-user-select:text'
    document.body.append(element)
  }

  document.addEventListener('copy', onCopy)
  let copied = false
  try {
    if (html) {
      const rich = document.createElement('div')
      rich.innerHTML = html
      hold(rich)
      const range = document.createRange()
      range.selectNodeContents(rich)
      selection?.removeAllRanges()
      selection?.addRange(range)
      try { copied = document.execCommand('copy') } catch { copied = false }
      rich.remove()
    }
    if (!copied) {
      const plain = document.createElement('textarea')
      plain.value = text
      hold(plain)
      plain.focus()
      plain.select()
      plain.setSelectionRange(0, text.length)
      try { copied = document.execCommand('copy') } catch { copied = false }
      plain.remove()
    }
  } finally {
    document.removeEventListener('copy', onCopy)
    selection?.removeAllRanges()
    savedRanges.forEach((range) => selection?.addRange(range))
  }
  if (!copied) throw new Error('document.execCommand("copy") returned false')
}

/**
 * Puts the text on the clipboard. With `html` set it copies BOTH a formatted version (bold, links, quotes…) and
 * the plain one, so the place you paste into chooses; with `html` empty only plain text is copied.
 * Rejects with the real error when the browser refuses, so the caller can log it.
 */
export async function copyToClipboard(payload: ClipboardPayload): Promise<void> {
  const rich = payload.html !== ''
  try {
    if (rich && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([payload.html], { type: 'text/html' }),
          'text/plain': new Blob([payload.text], { type: 'text/plain' }),
        }),
      ])
      return
    }
    if (!rich && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.text)
      return
    }
    legacyCopy(payload)
  } catch (error) {
    try {
      legacyCopy(payload)
    } catch {
      // Last resort: plain text only through the async API (fine when only the rich write was refused).
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.text)
        return
      }
      throw error
    }
  }
}
