/**
 * Question/answer "chat" inside an accordion item. In Markdown:
 *
 *   :::item{title="..."}
 *   سوال1 : (متن سوال)
 *   جواب1 : (متن جواب)
 *   ج2 : (جواب بعدی
 *   که می‌تواند چند پاراگراف باشد)
 *   متن بیرون از پرانتز = متن معمولی آکاردئون
 *   :::
 *
 * `سوال` / `س` start a question bubble, `جواب` / `ج` an answer bubble; the number is optional.
 * Only text INSIDE the parentheses goes into a bubble; everything else stays ordinary text.
 * Nested parentheses are fine: `(ص)` inside a bubble does not end it, and neither does a list
 * marker such as `۱) ...`. A message whose parenthesis is never closed leaves the item untouched.
 */

interface MdNode {
  type: string
  value?: string
  name?: string
  children?: MdNode[]
  data?: Record<string, unknown>
}

type Role = 'question' | 'answer'

interface OpenMessage {
  role: Role
  number: string
  blocks: MdNode[]
  inline: MdNode[]
  depth: number
}

type Output = { node: MdNode } | { message: { role: Role; number: string; blocks: MdNode[] } }

const MARKER = /[ \t]*(سوال|س|جواب|ج)[ \t]*([0-9۰-۹٠-٩]*)[ \t]*[:：][ \t]*\(/uy
const DIGITS = '۰۱۲۳۴۵۶۷۸۹'

function persianDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => DIGITS[Number(digit)]).replace(/[٠-٩]/g, (digit) => DIGITS[digit.charCodeAt(0) - 0x660])
}

const textNode = (value: string): MdNode => ({ type: 'text', value })

/** `۱) متن` / `۲) متن`: a numbering (digit(s) after a space, text after it), not the end of the message. */
function isListMarker(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 3), index)
  const after = text.slice(index + 1, index + 3)
  return /(?:^|\s)[0-9۰-۹٠-٩]{1,2}$/u.test(before) && /^[ \t]+\S/u.test(after)
}

/** Index of the parenthesis that closes the open message, or -1 (depth is carried to the next text node). */
function findClose(text: string, from: number, open: OpenMessage): number {
  for (let index = from; index < text.length; index += 1) {
    const character = text[index]
    if (character === '(') open.depth += 1
    else if (character === ')' && !isListMarker(text, index)) {
      open.depth -= 1
      if (open.depth === 0) return index
    }
  }
  return -1
}

/** Start of the next `سوال…: (` that begins a line, at or after `from`. */
function findMarker(text: string, from: number, atLineStart: boolean): { index: number; match: RegExpExecArray } | null {
  let index = from
  while (index <= text.length) {
    const lineStart = index === 0 ? atLineStart : text[index - 1] === '\n'
    if (lineStart) {
      MARKER.lastIndex = index
      const match = MARKER.exec(text)
      if (match) return { index, match }
    }
    const newline = text.indexOf('\n', index)
    if (newline < 0) return null
    index = newline + 1
  }
  return null
}

/** Removes the whitespace/newlines around a run of inline nodes; returns [] when nothing is left. */
function trimInline(nodes: MdNode[]): MdNode[] {
  const result = nodes.map((node) => ({ ...node }))
  while (result.length && result[0].type === 'text' && !result[0].value?.trim()) result.shift()
  while (result.length && result[result.length - 1].type === 'text' && !result[result.length - 1].value?.trim()) result.pop()
  if (result.length && result[0].type === 'text') result[0].value = result[0].value?.replace(/^\s+/, '')
  const last = result.length - 1
  if (last >= 0 && result[last].type === 'text') result[last].value = result[last].value?.replace(/\s+$/, '')
  return result
}

function scanParagraph(paragraph: MdNode, carried: OpenMessage | null, output: Output[]): OpenMessage | null {
  let open = carried
  const outside: MdNode[] = []
  let atLineStart = true

  const flushOutside = () => {
    const inline = trimInline(outside)
    if (inline.length) output.push({ node: { type: 'paragraph', children: inline } })
    outside.length = 0
  }
  const finishMessage = (message: OpenMessage) => {
    const inline = trimInline(message.inline)
    const blocks = inline.length ? [...message.blocks, { type: 'paragraph', children: inline }] : message.blocks
    output.push({ message: { role: message.role, number: message.number, blocks } })
  }

  for (const child of paragraph.children ?? []) {
    if (child.type !== 'text') {
      if (open) open.inline.push(child)
      else {
        outside.push(child)
        atLineStart = child.type === 'break'
      }
      continue
    }

    const text = child.value ?? ''
    let cursor = 0
    while (cursor < text.length) {
      if (open) {
        const end = findClose(text, cursor, open)
        if (end < 0) {
          open.inline.push(textNode(text.slice(cursor)))
          cursor = text.length
        } else {
          if (end > cursor) open.inline.push(textNode(text.slice(cursor, end)))
          finishMessage(open)
          open = null
          cursor = end + 1
          atLineStart = false
        }
        continue
      }

      const found = findMarker(text, cursor, atLineStart)
      if (!found) {
        outside.push(textNode(text.slice(cursor)))
        cursor = text.length
        break
      }
      if (found.index > cursor) outside.push(textNode(text.slice(cursor, found.index)))
      flushOutside()
      const word = found.match[1]
      open = {
        role: word === 'سوال' || word === 'س' ? 'question' : 'answer',
        number: found.match[2],
        blocks: [],
        inline: [],
        depth: 1,
      }
      cursor = found.index + found.match[0].length
    }
    atLineStart = text.endsWith('\n') || (!text.trim() && atLineStart)
    if (open) atLineStart = false
  }

  if (open) {
    // The message continues in the next block (a long answer with several paragraphs).
    const inline = trimInline(open.inline)
    if (inline.length) open.blocks.push({ type: 'paragraph', children: inline })
    open.inline = []
  }
  flushOutside()
  return open
}

function buildChildren(output: Output[]): MdNode[] {
  const children: MdNode[] = []
  let thread: MdNode | null = null

  for (const entry of output) {
    if ('node' in entry) {
      thread = null
      children.push(entry.node)
      continue
    }
    const { role, number, blocks } = entry.message
    if (blocks.length === 0) continue
    if (!thread) {
      thread = { type: 'chatThread', data: { hName: 'mdx-chat' }, children: [] }
      children.push(thread)
    }
    const label = `${role === 'question' ? 'سوال' : 'جواب'}${number ? ` ${persianDigits(number)}` : ''}`
    thread.children?.push({
      type: 'chatMessage',
      data: { hName: 'mdx-chatmsg', hProperties: { chatRole: role, chatLabel: label, chatIndex: String(thread.children.length) } },
      children: blocks,
    })
  }
  return children
}

function transformItem(item: MdNode): void {
  const output: Output[] = []
  let open: OpenMessage | null = null

  for (const block of item.children ?? []) {
    if (block.type === 'paragraph') open = scanParagraph(block, open, output)
    else if (open) open.blocks.push(block)
    else output.push({ node: block })
  }

  // An unclosed parenthesis, or no message at all: leave the item exactly as it was written.
  if (open || !output.some((entry) => 'message' in entry)) return
  item.children = buildChildren(output)
}

/** Turns question/answer lines inside accordion items into chat nodes (hast names `mdx-chat` / `mdx-chatmsg`). */
export function transformChatMessages(tree: MdNode): void {
  const visit = (node: MdNode) => {
    for (const child of node.children ?? []) visit(child)
    if (node.type === 'containerDirective' && node.name === 'item') transformItem(node)
  }
  visit(tree)
}
