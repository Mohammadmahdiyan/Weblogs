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
 * The "several quotes in one box" form is marked with `ITEMS_MARKER` as the first line of the quote;
 * `remarkQuoteItems` (markdown.ts) removes it and tells the renderer to give each item its own icons.
 * Text inside code fences is never touched; an opener without a closing `<<` is left as Markdown wrote it.
 */

export const ITEMS_MARKER = '<!--quote-items-->'

const CODE_FENCE = /^\s{0,3}(`{3,}|~{3,})/
const LONG_OPEN = /^(\s{0,3})>>(.*)$/
const QUOTE_LINE = /^(\s{0,3})>(.*)$/
const DIRECTIVE_FENCE = /^\s{0,3}:{3,}/
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
function readQuoteRun(lines: string[], start: number): { groups: { indent: string; first: string; lazy: string[] }[]; end: number } | null {
  const groups: { indent: string; first: string; lazy: string[] }[] = []
  let end = start
  let simple = true

  for (let index = start; index < lines.length && !isBlank(lines[index]); index += 1) {
    const quote = QUOTE_LINE.exec(lines[index])
    if (quote) {
      const content = stripOneSpace(quote[2])
      if (isBlank(content) || BLOCK_START.test(content)) simple = false
      groups.push({ indent: quote[1], first: content, lazy: [] })
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
        if (run.groups.length >= 2) {
          const indent = run.groups[0].indent
          output.push(`${indent}> ${ITEMS_MARKER}`, `${indent}>`)
          run.groups.forEach((group, position) => {
            if (position > 0) output.push(`${indent}>`)
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
