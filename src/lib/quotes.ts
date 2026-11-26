/**
 * Extra quote syntaxes, rewritten into ordinary Markdown BEFORE parsing:
 *
 *   > یک خط                      simple quote (unchanged Markdown)
 *
 *   >> متن طولانی                 one quote that continues over several lines (even blank ones)
 *   خط بعدی
 *
 *   آخرین خط<<                   …until a line that ends with `<<`
 *
 *   > متن اول
 *   > متن دوم                    two quotes in ONE box: every line that starts with `>` is its own quote
 *
 * A line WITHOUT `>` right under a `>` line still continues that quote (they are joined with a space), and a
 * blank line ends the box — exactly like normal Markdown:
 *
 *   > سلام خوبی
 *   چخبر                          → «سلام خوبی چخبر» in the quote
 *   (blank line)
 *   و سلام درود                   → plain text, outside the quote
 *
 *   >$ متن خیلی طولانی             a LONG quote: only its first lines show (the last one faded); a click opens the rest.
 *   >$ متن طولانی دیگر            Written one under another, each is its own collapsible quote in ONE box. `>$` and `>`
 *                                 lines mix freely. Like `>`, a `$` quote is one paragraph: keep it on one line (a line
 *                                 without `>` under it continues it).
 *
 * The "several quotes in one box" form is marked with `ITEMS_MARKER` as the first line of the quote;
 * `remarkQuoteItems` (markdown.ts) removes it and tells the renderer to give each item its own icons.
 * Text inside code fences is never touched; an opener without a closing `<<` is left as Markdown wrote it.
 */

export const ITEMS_MARKER = '<!--quote-items-->'
/** Comment line right before the paragraph of a `>$` quote; `remarkQuoteLong` (markdown.ts) turns it into `data-long`. */
export const LONG_MARKER = '<!--quote-long-->'
/** Sent to a collapsed long quote to open it (e.g. when search / a link points at text inside it). */
export const QUOTE_EXPAND_EVENT = 'quote-long-expand'

const CODE_FENCE = /^\s{0,3}(`{3,}|~{3,})/
const LONG_OPEN = /^(\s{0,3})>>(.*)$/
const QUOTE_LINE = /^(\s{0,3})>(.*)$/
const DIRECTIVE_FENCE = /^\s{0,3}:{3,}/
/** `>$ text`: the `$` must touch the `>` and be followed by a space (so `> $5` stays an ordinary quote). */
const LONG_FLAG = /^\$(?:[ \t]|$)/
/** Content that starts its own Markdown block (list, heading, nested quote, code, table, HTML…). */
const BLOCK_START = /^(?:[-*+][ \t]|\d+[.)][ \t]|#{1,6}[ \t]|>|`{3,}|~{3,}|\||:{2,}|<|-{3,}|={3,}|[ \t]{4,})/

const isBlank = (line: string) => line.trim() === ''
const stripOneSpace = (value: string) => (value.startsWith(' ') ? value.slice(1) : value)

/** Splits the text of a `>>…<<` quote into its lines, or returns null when no closing `<<` is found. */
function readLongQuote(lines: string[], start: number): { body: string[]; end: number } | null {
  const first = (LONG_OPEN.exec(lines[start]) as RegExpExecArray)[2]
  const body: string[] = []

  for (let index = start; index < lines.length; index += 1) {
    const raw = index === start ? stripOneSpace(first) : lines[index]
    if (index > start && (LONG_OPEN.test(raw) || DIRECTIVE_FENCE.test(raw))) return null
    const trimmed = raw.trimEnd()
    if (trimmed.endsWith('<<')) {
      body.push(trimmed.slice(0, -2).trimEnd())
      return { body, end: index }
    }
    body.push(raw)
  }
  return null
}

function writeLongQuote(indent: string, rawBody: string[]): string[] {
  const body = [...rawBody]
  while (body.length && isBlank(body[0])) body.shift()
  while (body.length && isBlank(body[body.length - 1])) body.pop()

  return body.map((line, index) => {
    if (isBlank(line)) return `${indent}>`
    // An Enter inside the quote stays an Enter (a hard line break), except before a blank line / at the end.
    const next = body[index + 1]
    const keepBreak = next !== undefined && !isBlank(next)
    return `${indent}> ${line.trim()}${keepBreak ? '  ' : ''}`
  })
}

/** Gathers a run of `>` lines (plus the lazy continuation lines under them). Returns null if it is not simple. */
interface QuoteGroup {
  indent: string
  first: string
  lazy: string[]
  /** Written with `>$`: collapsible. */
  long: boolean
}

function readQuoteRun(lines: string[], start: number): { groups: QuoteGroup[]; end: number } | null {
  const groups: QuoteGroup[] = []
  let end = start
  let simple = true

  for (let index = start; index < lines.length && !isBlank(lines[index]); index += 1) {
    const quote = QUOTE_LINE.exec(lines[index])
    if (quote) {
      const long = LONG_FLAG.test(quote[2])
      const content = long ? quote[2].slice(1).replace(/^[ \t]/, '') : stripOneSpace(quote[2])
      if (isBlank(content) || BLOCK_START.test(content)) simple = false
      groups.push({ indent: quote[1], first: content, lazy: [], long })
    } else if (BLOCK_START.test(lines[index].trimStart()) || CODE_FENCE.test(lines[index]) || DIRECTIVE_FENCE.test(lines[index])) {
      break
    } else {
      groups[groups.length - 1].lazy.push(lines[index])
    }
    end = index
  }
  return simple ? { groups, end } : { groups: [], end }
}

export function normalizeQuotes(markdown: string): string {
  if (!markdown.includes('>')) return markdown

  const eol = markdown.includes('\r\n') ? '\r\n' : '\n'
  const lines = markdown.split(/\r?\n/)
  const output: string[] = []
  let fence: string | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const codeFence = CODE_FENCE.exec(line)
    if (codeFence) {
      const marker = codeFence[1]
      if (fence === null) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null
      output.push(line)
      continue
    }
    if (fence !== null) {
      output.push(line)
      continue
    }

    if (LONG_OPEN.test(line)) {
      const long = readLongQuote(lines, index)
      if (long) {
        output.push(...writeLongQuote((LONG_OPEN.exec(line) as RegExpExecArray)[1], long.body))
        index = long.end
        continue
      }
    }

    if (QUOTE_LINE.test(line)) {
      const run = readQuoteRun(lines, index)
      if (run) {
        if (run.groups.length >= 2 || run.groups.some((group) => group.long)) {
          const indent = run.groups[0].indent
          if (run.groups.length >= 2) output.push(`${indent}> ${ITEMS_MARKER}`, `${indent}>`)
          run.groups.forEach((group, position) => {
            if (position > 0) output.push(`${indent}>`)
            if (group.long) output.push(`${group.indent}> ${LONG_MARKER}`, `${group.indent}>`)
            output.push(`${group.indent}> ${group.first}`, ...group.lazy)
          })
        } else {
          output.push(...lines.slice(index, run.end + 1))
        }
        index = run.end
        continue
      }
    }
    output.push(line)
  }
  return output.join(eol)
}
