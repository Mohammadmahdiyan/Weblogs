import { FIND_END_PARAM, FIND_INDEX_PARAM, FIND_PARAM } from './contentSearch.ts'

/**
 * Copying a selected piece of an article as a link to that exact place.
 *
 * The link is the article's own address plus `?find=…` (and `&e=…`, `&n=…`), which the article page already
 * understands: it scrolls to the text and highlights it (src/lib/findInPage.ts).
 */

/** A longer selection is shown shortened with "..." in the link text, unless the reader asks for the whole text. */
export const LABEL_MAX_LENGTH = 50
export const ELLIPSIS = '...'

/** Where a piece of the article is, in the words `?find=` / `&e=` / `&n=` understand (see `locateText`). */
export interface TextAnchor {
  /** The passage (or, for a long one, its beginning). */
  find: string
  /** The end of a long passage. */
  end?: string
  /** 0-based: which occurrence of `find` on the page it is. */
  occurrence: number
}

const squash = (value: string) => value.replace(/\s+/g, ' ').trim()

export const isLongSelection = (selected: string): boolean => squash(selected).length > LABEL_MAX_LENGTH

/** The words shown as the link text: the selection, cut at a word boundary with "..." when it is long. */
export function linkLabel(selected: string, fullText: boolean): string {
  const text = squash(selected)
  if (fullText || text.length <= LABEL_MAX_LENGTH) return text
  const cut = text.slice(0, LABEL_MAX_LENGTH)
  const space = cut.lastIndexOf(' ')
  // Cut at the last space when that keeps most of the length; a single long word is cut where it is.
  const kept = space >= LABEL_MAX_LENGTH * 0.6 ? cut.slice(0, space) : cut
  return `${kept.replace(/[\s,.،؛:؟!]+$/u, '')}${ELLIPSIS}`
}

/** `articleUrl` is the article's address without query or hash; the result opens it at the selected text. */
export function textLinkUrl(articleUrl: string, anchor: TextAnchor): string {
  const base = articleUrl.split(/[?#]/, 1)[0]
  const parts = [`${FIND_PARAM}=${encodeURIComponent(anchor.find)}`]
  if (anchor.end) parts.push(`${FIND_END_PARAM}=${encodeURIComponent(anchor.end)}`)
  if (anchor.occurrence > 0) parts.push(`${FIND_INDEX_PARAM}=${Math.floor(anchor.occurrence) + 1}`)
  // `(` and `)` would end a Markdown link early.
  return `${base}?${parts.join('&')}`.replace(/\(/g, '%28').replace(/\)/g, '%29')
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface LinkPayload {
  html: string
  text: string
}

/**
 * For Telegram: the text as a link. Telegram Desktop turns the HTML half into blue linked text. Telegram on a phone
 * only takes the plain half, which has no way to hide an address behind words, so there the link follows the text.
 */
export function telegramLinkPayload(label: string, url: string): LinkPayload {
  return { html: `<a href="${escapeHtml(url).replace(/"/g, '&quot;')}">${escapeHtml(label)}</a>`, text: `${label}\n${url}` }
}

/** For code: the same link as Markdown, `[text](link)`. */
export function markdownLink(label: string, url: string): string {
  return `[${label.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')}](${url})`
}
