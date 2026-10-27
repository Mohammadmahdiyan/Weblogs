export interface ClipboardPayload {
  html: string
  text: string
}

/** Old-school copy that works without the async Clipboard API (plain http, older browsers). Throws when refused. */
function legacyCopy({ html, text }: ClipboardPayload): void {
  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/html', html)
    event.clipboardData?.setData('text/plain', text)
    event.preventDefault()
  }
  const holder = document.createElement('textarea')
  holder.value = text
  holder.setAttribute('readonly', '')
  holder.style.cssText = 'position:fixed;top:0;inset-inline-start:0;opacity:0;pointer-events:none'
  document.body.append(holder)
  holder.select()
  document.addEventListener('copy', onCopy)
  try {
    if (!document.execCommand('copy')) throw new Error('document.execCommand("copy") returned false')
  } finally {
    document.removeEventListener('copy', onCopy)
    holder.remove()
  }
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
      throw error
    }
  }
}
