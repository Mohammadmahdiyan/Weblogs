import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import siteConfig from '../site.config.ts'
import { transformChatMessages } from './chat.ts'
import { normalizeDirectiveFences } from './directives.ts'
import { normalizeQuotes } from './quotes.ts'
import { isEmoji } from './emojiRegistry.ts'
import { splitInline } from './inline.ts'
import { honorifics } from './honorifics.ts'

/**
 * Article Markdown → text for Telegram.
 *
 * Telegram can show: bold, italic, underline, strikethrough, monospace, spoiler, quote and links.
 * The result comes in two forms, both put on the clipboard together:
 *  - `html`: real formatting (<b> <i> <u> <s> <code> <pre> <a> <blockquote>), kept when pasted into Telegram;
 *  - `text`: the same text with Telegram's typed markup (**bold**, __italic__, ~~strike~~, `mono`, ||spoiler||),
 *    which Telegram turns into formatting when the message is sent.
 */

export interface TelegramPayload {
  html: string
  text: string
}

export interface TelegramOptions {
  /**
   * How a quote is written in the PLAIN text.
   *  - `marker` (default): every line starts with `> `. Telegram Desktop turns the HTML into a real quote, so this
   *    only shows in plain-text places.
   *  - `guillemets`: the quote is wrapped in « … ». Telegram on phones ignores the HTML half of the clipboard and
   *    has no typed markup for quotes, so a `>` would stay as a stray character there; «…» reads naturally.
   */
  plainQuote?: 'marker' | 'guillemets'
}

export type TelegramPartKind = 'section' | 'quote'

// ───────────────────────────── a small tree of what Telegram can show

type MediaKind = 'image' | 'video' | 'audio'

type Inline =
  | string
  /** A picture / video / sound is written as its file name (numbered when there are several of the same kind). */
  | { kind: 'media'; media: MediaKind; name: string; number?: number }
  | { kind: 'b' | 'i' | 'u' | 's' | 'code' | 'spoiler'; children: Inline[] }
  | { kind: 'a'; href: string; children: Inline[] }

type Block =
  | { kind: 'text'; content: Inline[] }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'pre'; text: string }

// ───────────────────────────── Markdown → mdast (same source text the page renders)

interface MdNode {
  type: string
  value?: string
  url?: string
  name?: string
  depth?: number
  ordered?: boolean
  start?: number | null
  alt?: string | null
  title?: string | null
  attributes?: Record<string, string | null | undefined>
  data?: { hProperties?: Record<string, unknown> }
  position?: { start: { offset?: number } }
  children?: MdNode[]
}

/** The text the page really parses (quote and directive syntax already rewritten). */
export const prepareSource = (markdown: string): string => normalizeQuotes(normalizeDirectiveFences(markdown))

function parse(markdown: string): MdNode {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)
  const tree = processor.parse(prepareSource(markdown)) as unknown as MdNode
  transformChatMessages(tree as never)
  return tree
}

// ───────────────────────────── mdast → blocks

const SPOILER = /\|\|([^|\n]+)\|\|(?:\{متن انیمیشن:[^}]*\})?/gu
/** Enters are kept (the page shows them as spaces, a chat message should keep the line); spaces around them go. */
const keepEnters = (value: string) => value.replace(/[ \t]*\r?\n[ \t]*/g, '\n')

// ── honorifics: «(ص)» → «(ﷺ)», «(ع)» → «(علیه السلام)», «(جل)» → «(جل جلاله)» …
const toPersianLetters = (value: string) => value.replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک')
const honorificKey = (value: string) => toPersianLetters(value).replace(/[\u064B-\u065F\u0670\u0640\u200c]/g, '').replace(/ة/g, 'ه').replace(/\s+/g, '')

/** Telegram has no pictures here, so every marker is written out; the Prophet's «ص» becomes the single sign ﷺ. */
const TELEGRAM_HONORIFICS = new Map<string, string>([
  ...Object.entries(honorifics).map(([key, config]): [string, string] => [honorificKey(key), config.file === 'sas.svg' ? 'ﷺ' : toPersianLetters(config.label)]),
  [honorificKey('صله الله علیه وسلم'), 'ﷺ'], // a common spelling slip
])

function writeHonorifics(value: string): string {
  return value.replace(/\(\s*([^()\n]{1,40}?)\s*\)/gu, (match, inner: string) => {
    const phrase = TELEGRAM_HONORIFICS.get(honorificKey(inner))
    return phrase ? `(${phrase})` : match
  })
}

function absoluteUrl(href: string): string | null {
  if (/^https?:\/\//i.test(href) || /^(tg|mailto):/i.test(href)) return href
  if (href.startsWith('/') && !href.startsWith('//')) return `${siteConfig.siteUrl.replace(/\/$/, '')}${href}`
  return null // `#section`, `./file`, `javascript:` … cannot work inside Telegram
}

/** Plain text of the article: mini-text keeps its words and emoji names disappear. */
function extras(value: string): Inline[] {
  return splitInline(value, isEmoji).flatMap((segment): Inline[] =>
    segment.type === 'text' ? [segment.value] : segment.type === 'mini' ? [segment.text] : [])
}

function textInline(rawValue: string): Inline[] {
  const value = writeHonorifics(keepEnters(rawValue))
  const output: Inline[] = []
  let cursor = 0
  for (const match of value.matchAll(SPOILER)) {
    const start = match.index ?? 0
    if (start > cursor) output.push(...extras(value.slice(cursor, start)))
    output.push({ kind: 'spoiler', children: extras(match[1]) })
    cursor = start + match[0].length
  }
  if (cursor < value.length) output.push(...extras(value.slice(cursor)))
  return output
}

const HTML_FORMAT: Record<string, 'b' | 'i' | 'u' | 's' | 'code'> = {
  b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', ins: 'u', s: 's', del: 's', strike: 's', code: 'code',
}
const HTML_TAG = /^<\s*(\/)?\s*([a-z][a-z0-9]*)\b[^>]*?(\/)?\s*>$/i

const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)$/i
const AUDIO_FILE = /\.(mp3|ogg|oga|wav|m4a|aac|opus|flac)$/i

/** The file name of a link, with its extension: `./folder/my%20pic.png?v=2` → `my pic.png`. */
function fileName(url: string): string {
  const last = url.split(/[?#]/)[0].split('/').pop() ?? ''
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/** A picture, video or sound cannot be pasted as text, so only the name of its file is written. */
function mediaOf(url: string, fallback: string, kind?: MediaKind): Inline {
  const name = fileName(url) || fallback
  const media: MediaKind = kind ?? (VIDEO_FILE.test(name) ? 'video' : AUDIO_FILE.test(name) ? 'audio' : 'image')
  return { kind: 'media', media, name }
}

function inlines(nodes: MdNode[] = []): Inline[] {
  // Raw HTML such as <u>…</u> arrives as separate opening / closing nodes, so a stack groups what is between them.
  const root: Inline[] = []
  const stack: { kind: 'b' | 'i' | 'u' | 's' | 'code'; children: Inline[] }[] = []
  const push = (item: Inline | Inline[]) => (stack.length ? stack[stack.length - 1].children : root).push(...(Array.isArray(item) ? item : [item]))

  for (const node of nodes) {
    switch (node.type) {
      case 'text': push(textInline(node.value ?? '')); break
      case 'strong': push({ kind: 'b', children: inlines(node.children) }); break
      case 'emphasis': push({ kind: 'i', children: inlines(node.children) }); break
      case 'delete': push({ kind: 's', children: inlines(node.children) }); break
      case 'inlineCode': push({ kind: 'code', children: [node.value ?? ''] }); break
      case 'break': push('\n'); break
      case 'link': {
        const href = absoluteUrl(node.url ?? '')
        const children = inlines(node.children)
        push(href ? { kind: 'a', href, children } : children)
        break
      }
      case 'html': {
        const tag = HTML_TAG.exec((node.value ?? '').trim())
        if (!tag) break
        const name = tag[2].toLowerCase()
        if (name === 'br') push('\n')
        else if (HTML_FORMAT[name] && tag[1]) {
          const open = stack.pop()
          if (open) push({ kind: open.kind, children: open.children })
        } else if (HTML_FORMAT[name] && !tag[3]) stack.push({ kind: HTML_FORMAT[name], children: [] })
        break
      }
      case 'image': push(mediaOf(node.url ?? '', (node.alt ?? '').trim() || (node.title ?? '').trim())); break
      case 'imageReference': break
      case 'footnoteReference': break
      default: push(inlines(node.children))
    }
  }
  while (stack.length) {
    const open = stack.pop() as { kind: 'b' | 'i' | 'u' | 's' | 'code'; children: Inline[] }
    push({ kind: open.kind, children: open.children })
  }
  return root
}

/** A paragraph that began or ended with a dropped image should not start / end with a stray space. */
function trimEdges(content: Inline[]): Inline[] {
  const trimmed = [...content]
  if (typeof trimmed[0] === 'string') trimmed[0] = trimmed[0].trimStart()
  const last = trimmed.length - 1
  if (typeof trimmed[last] === 'string') trimmed[last] = (trimmed[last] as string).trimEnd()
  return trimmed.filter((item) => item !== '')
}

const text = (content: Inline[]): Block[] => (content.length ? [{ kind: 'text', content }] : [])
const bold = (value: string): Inline => ({ kind: 'b', children: [value] })
const mediaUrl = (node: MdNode) => node.attributes?.link ?? node.attributes?.src ?? node.attributes?.url ?? ''

function listLines(list: MdNode, depth = 0): Inline[][] {
  const lines: Inline[][] = []
  const indent = '\u2003'.repeat(depth)
  let number = list.start ?? 1

  for (const item of list.children ?? []) {
    const marker = list.ordered ? `${(number++).toLocaleString('fa-IR')}. ` : depth ? '◦ ' : '• '
    let first = true
    for (const child of item.children ?? []) {
      if (child.type === 'list') {
        lines.push(...listLines(child, depth + 1))
      } else {
        const content = inlines(child.type === 'paragraph' ? child.children : [child])
        if (content.length === 0) continue
        lines.push([first ? `${indent}${marker}` : `${indent}\u2003`, ...content])
        first = false
      }
    }
  }
  return lines
}

const joinLines = (lines: Inline[][]): Inline[] => lines.flatMap((line, index) => (index ? ['\n', ...line] : line))

function blocksOf(node: MdNode): Block[] {
  switch (node.type) {
    case 'paragraph': {
      const children = node.children ?? []
      const onlyImages = children.some((child) => child.type === 'image') && children.every((child) => child.type === 'image' || (child.type === 'text' && !(child.value ?? '').trim()) || child.type === 'break')
      if (onlyImages) {
        const files = children.filter((child) => child.type === 'image').map((child): Inline => mediaOf(child.url ?? '', (child.alt ?? '').trim()))
        return text(joinLines(files.map((file) => [file])))
      }
      return text(trimEdges(inlines(children)))
    }
    case 'heading': return text([{ kind: 'b', children: inlines(node.children) }])
    case 'blockquote': {
      const inner = (node.children ?? []).flatMap(blocksOf)
      return inner.length ? [{ kind: 'quote', blocks: inner }] : []
    }
    case 'list': return text(joinLines(listLines(node)))
    case 'code': return [{ kind: 'pre', text: node.value ?? '' }]
    case 'thematicBreak': return text(['———'])
    case 'html': {
      const plain = (node.value ?? '').replace(/<[^>]*>/g, '').trim()
      return plain ? text([plain]) : []
    }
    case 'table': {
      const rows = (node.children ?? []).map((row, index): Inline[] => {
        const cells = (row.children ?? []).flatMap((cell, position): Inline[] => {
          const content = inlines(cell.children)
          const shown: Inline[] = index === 0 ? [{ kind: 'b', children: content }] : content
          return position ? [' | ', ...shown] : shown
        })
        return cells
      })
      return text(joinLines(rows))
    }
    case 'chatMessage': {
      const label = String(node.data?.hProperties?.chatLabel ?? '').trim()
      const inner = (node.children ?? []).flatMap(blocksOf)
      if (!label) return inner
      const first = inner[0]
      if (first?.kind === 'text') return [{ kind: 'text', content: [bold(`${label}:`), ' ', ...first.content] }, ...inner.slice(1)]
      return [{ kind: 'text', content: [bold(`${label}:`)] }, ...inner]
    }
    case 'leafDirective': {
      const url = mediaUrl(node)
      if (node.name === 'video' || node.name === 'audio') return url ? text([mediaOf(url, '', node.name)]) : []
      if (['youtube', 'aparat', 'instagram', 'embed'].includes(node.name ?? '') && /^https?:\/\//i.test(url)) return text([url])
      return []
    }
    case 'containerDirective': {
      const inner = (node.children ?? []).flatMap(blocksOf)
      const name = node.name ?? ''
      const title = (node.attributes?.title ?? '').trim()
      if (name === 'source') {
        const head = [node.attributes?.site, title, node.attributes?.ref].filter(Boolean).join(' · ')
        const body = [...(head ? text([bold(head)]) : []), ...inner]
        return body.length ? [{ kind: 'quote', blocks: body }] : []
      }
      if ((name === 'item' || name === 'modal') && title) return [...text([bold(title)]), ...inner]
      return inner
    }
    case 'chatThread': case 'root': return (node.children ?? []).flatMap(blocksOf)
    default: return []
  }
}

// ───────────────────────────── blocks → the two clipboard forms

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttribute = (value: string) => escapeHtml(value).replace(/"/g, '&quot;')

const mediaLabel = (item: { name: string; number?: number }) => (item.number ? `${item.number}. ${item.name}` : item.name)

function inlineHtml(item: Inline): string {
  if (typeof item === 'string') return escapeHtml(item).replace(/\n/g, '<br>')
  if (item.kind === 'media') return escapeHtml(mediaLabel(item))
  const inner = item.children.map(inlineHtml).join('')
  if (item.kind === 'a') return `<a href="${escapeAttribute(item.href)}">${inner}</a>`
  if (item.kind === 'spoiler') return `<tg-spoiler>${inner}</tg-spoiler>`
  return `<${item.kind}>${inner}</${item.kind}>`
}

function blockHtml(block: Block): string {
  if (block.kind === 'text') return block.content.map(inlineHtml).join('')
  if (block.kind === 'pre') return `<pre>${escapeHtml(block.text)}</pre>`
  return `<blockquote>${joinHtml(block.blocks)}</blockquote>`
}

function joinHtml(blocks: Block[]): string {
  return blocks.map((block, index) => {
    const html = blockHtml(block)
    if (index === 0) return html
    // A quote already ends its own line, so one <br> is enough around it.
    const single = block.kind === 'quote' || blocks[index - 1].kind === 'quote'
    return `${single ? '<br>' : '<br><br>'}${html}`
  }).join('')
}

const MARKERS = { b: '**', i: '__', s: '~~', code: '`', spoiler: '||' } as const

function inlineText(item: Inline): string {
  if (typeof item === 'string') return item
  if (item.kind === 'media') return mediaLabel(item)
  const inner = item.children.map(inlineText).join('')
  if (item.kind === 'u') return inner
  if (item.kind === 'a') return inner.trim() === item.href ? item.href : `${inner} (${item.href})`
  // Telegram only understands the markers when they touch the words, so spaces are moved outside them.
  const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner) as RegExpExecArray
  const marker = MARKERS[item.kind]
  return parts[2] ? `${parts[1]}${marker}${parts[2]}${marker}${parts[3]}` : inner
}

function blockText(block: Block, quote: TelegramOptions['plainQuote']): string {
  if (block.kind === 'text') return block.content.map(inlineText).join('')
  if (block.kind === 'pre') return `\`\`\`\n${block.text}\n\`\`\``
  const inner = joinText(block.blocks, quote)
  if (quote === 'guillemets') return `«${inner.trim()}»`
  return inner.split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n')
}

const joinText = (blocks: Block[], quote: TelegramOptions['plainQuote']): string => blocks.map((block) => blockText(block, quote)).join('\n\n')

/** Pictures (and, separately, videos and sounds) are numbered 1., 2., … from the top, but only when there are several. */
function numberMedia(blocks: Block[]): void {
  const found: Record<MediaKind, Extract<Inline, { kind: 'media' }>[]> = { image: [], video: [], audio: [] }
  const walkInline = (items: Inline[]) => {
    for (const item of items) {
      if (typeof item === 'string') continue
      if (item.kind === 'media') found[item.media].push(item)
      else walkInline(item.children)
    }
  }
  const walk = (list: Block[]) => {
    for (const block of list) {
      if (block.kind === 'text') walkInline(block.content)
      else if (block.kind === 'quote') walk(block.blocks)
    }
  }
  walk(blocks)
  for (const items of Object.values(found)) {
    if (items.length > 1) items.forEach((item, index) => { item.number = index + 1 })
  }
}

function payloadOf(blocks: Block[], options: TelegramOptions = {}): TelegramPayload {
  numberMedia(blocks)
  const meaningful = blocks.filter((block) => block.kind !== 'text' || block.content.some((item) => typeof item !== 'string' || item.trim() !== ''))
  return { html: joinHtml(meaningful), text: joinText(meaningful, options.plainQuote ?? 'marker').trim() }
}

// ───────────────────────────── public API

/** The whole article. */
export function telegramFromMarkdown(markdown: string, options: TelegramOptions = {}): TelegramPayload {
  return payloadOf(blocksOf(parse(markdown)), options)
}

/** Block types a click can copy: headings and quotes (they carry `data-src`, see `remarkSourceOffsets` in markdown.ts). */
const PICKABLE = new Set(['heading', 'blockquote'])

function locate(node: MdNode, offset: number): { node: MdNode; siblings: MdNode[]; index: number } | null {
  const children = node.children ?? []
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]
    if (PICKABLE.has(child.type) && child.position?.start.offset === offset) return { node: child, siblings: children, index }
    const inside = locate(child, offset)
    if (inside) return inside
  }
  return null
}

/**
 * One part of the article, chosen by where it starts in the source: a heading gives its whole section (up to the
 * next heading of the same or a higher level, so `##` includes its `###` parts); a quote gives itself.
 */
export function telegramPart(markdown: string, offset: number, options: TelegramOptions = {}): { payload: TelegramPayload; kind: TelegramPartKind } | null {
  const found = locate(parse(markdown), offset)
  if (!found) return null

  const { node, siblings, index } = found
  let nodes = [node]
  let kind: TelegramPartKind = 'quote'

  if (node.type === 'heading') {
    kind = 'section'
    const end = siblings.findIndex((sibling, position) => position > index && sibling.type === 'heading' && (sibling.depth ?? 6) <= (node.depth ?? 6))
    nodes = siblings.slice(index, end < 0 ? undefined : end)
  }

  const payload = payloadOf(nodes.flatMap(blocksOf), options)
  return payload.text ? { payload, kind } : null
}
