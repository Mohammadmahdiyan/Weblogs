import { normalizeSearchText } from './normalize.ts'

/**
 * Small inline syntaxes written in Markdown text (never inside code):
 *
 *   ((متن))(سایز: کوچک، قرارگیری: وسط)   → small raised/lowered text, like ³¹²⁴ in Telegram
 *   {خخخ}                               → an emoji registered in src/emojis/emojis.json
 *
 * This file only finds them; markdown.ts turns them into nodes and plainText.ts into search text.
 */

export type MiniSize = 'small' | 'medium' | 'large'
export type MiniPlacement = 'top' | 'middle' | 'bottom'

export interface MiniOptions {
  size: MiniSize
  placement: MiniPlacement
}

export const DEFAULT_MINI: MiniOptions = { size: 'medium', placement: 'top' }

const sizeWords: Record<string, MiniSize> = { کوچک: 'small', متوسط: 'medium', بزرگ: 'large' }
const placementWords: Record<string, MiniPlacement> = { بالا: 'top', وسط: 'middle', پایین: 'bottom' }

/** Words are compared without spaces / ZWNJ and with Arabic letter variants unified. */
const compact = (value: string) => normalizeSearchText(value).replace(/\s+/g, '')

/**
 * `سایز: کوچک،قرارگیری: وسط` → options. Either part may be missing or in any order;
 * unknown words fall back to the defaults (`medium`, `top`).
 */
export function parseMiniOptions(raw: string | undefined): MiniOptions {
  const options = { ...DEFAULT_MINI }
  if (!raw) return options
  for (const part of raw.split(/[،,؛;]/u)) {
    const separator = part.search(/[:：]/u)
    if (separator < 0) continue
    const key = compact(part.slice(0, separator))
    const value = compact(part.slice(separator + 1))
    if (key === 'سایز' && value in sizeWords) options.size = sizeWords[value]
    else if (key === 'قرارگیری' && value in placementWords) options.placement = placementWords[value]
  }
  return options
}

export type InlineSegment =
  | { type: 'text'; value: string }
  | ({ type: 'mini'; text: string } & MiniOptions)
  | { type: 'emoji'; name: string }

// ((text)) optionally followed by (سایز: …) / (قرارگیری: …); or {name}
const INLINE_PATTERN = /\(\(([^()\n]+?)\)\)(?:\(\s*((?:سایز|قرار[\s\u200c]*گیری)\s*[:：][^()\n]*)\))?|\{([^{}\n]+)\}/gu

/**
 * Splits text into plain text, mini-text and emoji segments. A `{name}` that is not a registered emoji
 * (see `isEmoji`) stays ordinary text, so other uses of braces are never touched.
 */
export function splitInline(value: string, isEmoji: (name: string) => boolean): InlineSegment[] {
  const segments: InlineSegment[] = []
  let cursor = 0
  let textStart = 0

  const flushText = (end: number) => {
    if (end > textStart) segments.push({ type: 'text', value: value.slice(textStart, end) })
  }

  for (const match of value.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0
    if (match[3] !== undefined) {
      const name = match[3].trim()
      if (!isEmoji(name)) continue
      flushText(start)
      segments.push({ type: 'emoji', name })
    } else {
      flushText(start)
      segments.push({ type: 'mini', text: match[1].trim(), ...parseMiniOptions(match[2]) })
    }
    cursor = start + match[0].length
    textStart = cursor
  }
  flushText(value.length)
  return segments
}

/** Text a reader sees/searches: mini-text keeps its words, emoji disappear. */
export function inlineToPlainText(value: string, isEmoji: (name: string) => boolean): string {
  return splitInline(value, isEmoji)
    .map((segment) => (segment.type === 'text' ? segment.value : segment.type === 'mini' ? segment.text : ''))
    .join('')
}
