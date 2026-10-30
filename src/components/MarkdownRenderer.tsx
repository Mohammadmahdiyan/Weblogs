import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { Copy, ExternalLink, Link2, Quote } from 'lucide-react'
import { createMarkdownProcessor, type MarkdownComponents } from '../lib/markdown'
import { withMdxErrorBoundary } from '../lib/mdx-component'
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Buttons,
  Card,
  Collapse,
  Course,
  IconButton,
  Lead,
  List,
  Pagination,
  Popover,
  Rating,
  Select,
  Skeleton,
  Spinner,
  Suggested,
  Switch,
  Tooltip,
  UnknownDirective,
} from './mdx/ContentBlocks'
import { AccordionItem as MdxAccordionItem, Accordion as MdxAccordion, Modal } from './mdx/InteractiveBlocks'
import { AudioDirective, Gallery, MarkdownImage, MarkdownVideo, VideoDirective } from './mdx/MediaBlocks'
import { RawIframe, SafeEmbed } from './mdx/SafeEmbed'
import { Source } from './mdx/Source'
import { Emoji, Mini } from './mdx/InlineExtras'
import { ChatMessage, ChatThread } from './mdx/ChatBlocks'
import { normalizeDirectiveFences } from '../lib/directives'
import { normalizeQuotes } from '../lib/quotes'
import { highlightCode } from '../lib/highlight'
import { confirmAdultAccess, isAdultConfirmed, rejectAdultAccess } from '../lib/adultAccess'

type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type HeadingProps = ComponentPropsWithoutRef<'h2'> & { id?: string }

function createHeading(tag: HeadingTag) {
  return function Heading({ id, children, className, ...props }: HeadingProps) {
    const Tag = tag
    return (
      <div className="group relative text-start">
        <Tag id={id} className={clsx('scroll-mt-24 text-start', className)} {...props}>
          {children}
        </Tag>
        {id && (
          <a
            href={`#${id}`}
            aria-label="پیوند به این عنوان"
            className="absolute -start-6 top-1 hidden text-[var(--text-muted)] group-hover:inline-flex group-focus-within:inline-flex"
          >
            <Link2 aria-hidden="true" className="size-4" />
          </a>
        )}
      </div>
    )
  }
}

function Paragraph(props: ComponentPropsWithoutRef<'p'>) {
  return <p {...props} className={clsx('text-start leading-8', props.className)} />
}

function Anchor({ href, target, rel, children, className, ...props }: ComponentPropsWithoutRef<'a'>) {
  const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href)
  const safeTarget = isExternal ? '_blank' : target
  const safeRel = isExternal ? clsx(rel, 'noopener noreferrer') : rel

  return (
    <a
      {...props}
      href={href}
      target={safeTarget}
      rel={safeRel}
      className={clsx('text-[var(--info)] no-underline', className)}
    >
      {children}
      {isExternal && <ExternalLink aria-hidden="true" className="ms-1 inline size-3.5 align-text-top" />}
    </a>
  )
}

function UnorderedList(props: ComponentPropsWithoutRef<'ul'>) {
  return <ul {...props} className={clsx('list-disc ps-6 text-start', props.className)} />
}

function OrderedList(props: ComponentPropsWithoutRef<'ol'>) {
  return <ol {...props} className={clsx('list-decimal ps-6 text-start', props.className)} />
}

function ListItem(props: ComponentPropsWithoutRef<'li'>) {
  return <li {...props} className={clsx('ps-1 marker:text-[var(--brand)]', props.className)} />
}

function QuoteIcon({ end = false }: { end?: boolean }) {
  // Same glyph at both ends of the quote; the closing one is turned 180°.
  return (
    <Quote
      aria-hidden="true"
      strokeWidth={2.2}
      className={clsx(
        'md-quote-icon inline-block size-4 shrink-0 align-[-0.2em] text-[var(--brand)]',
        end ? 'ms-1.5 rotate-180' : 'me-1.5',
      )}
    />
  )
}

function isParagraphElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node) && (node.type === Paragraph || node.type === 'p')
}

/** Puts the opening icon right before the first word and the closing icon right after the last word. */
function withQuoteIcons(children: ReactNode): ReactNode {
  const nodes = Children.toArray(children)
  const elementIndexes = nodes.flatMap((node, index) => (isValidElement(node) ? [index] : []))
  if (elementIndexes.length === 0) return <><QuoteIcon />{nodes}<QuoteIcon end /></>

  const firstIndex = elementIndexes[0]
  const lastIndex = elementIndexes[elementIndexes.length - 1]
  const output: ReactNode[] = []

  nodes.forEach((node, index) => {
    let current: ReactNode = node
    if (index === firstIndex) {
      // A quote that opens with a list/table/etc. gets the icon on a line of its own.
      if (isParagraphElement(current)) {
        current = cloneElement(current, undefined, <QuoteIcon key="quote-start" />, ...Children.toArray(current.props.children))
      } else {
        output.push(<div key="quote-start"><QuoteIcon /></div>)
      }
    }
    if (index === lastIndex) {
      if (isParagraphElement(current)) {
        current = cloneElement(current, undefined, ...Children.toArray(current.props.children), <QuoteIcon key="quote-end" end />)
      } else {
        output.push(current, <div key="quote-end"><QuoteIcon end /></div>)
        return
      }
    }
    output.push(current)
  })
  return output
}

/** Several quotes in one box: every paragraph is a quote of its own, with its own opening/closing icons. */
function withQuoteItems(children: ReactNode): ReactNode {
  return Children.toArray(children).flatMap((node, index) => (
    isValidElement(node) ? [<div key={index} className="md-quote-item">{withQuoteIcons(node)}</div>] : []
  ))
}

function Blockquote(props: ComponentPropsWithoutRef<'blockquote'>) {
  const { children, className, ...rest } = props
  const items = (rest as Record<string, unknown>)['data-quote-items'] === 'true'

  return (
    <div className="my-1 pt-1">
      <blockquote
        {...rest}
        className={clsx('md-quote group relative isolate overflow-hidden text-start text-[var(--text)]', className)}
      >
        <span aria-hidden="true" className="md-quote-rail pointer-events-none absolute inset-y-0 end-0 z-10" />
        <div className="quote-highlight relative text-start leading-8 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>p]:relative [&>p]:z-0">
          {items ? withQuoteItems(children) : withQuoteIcons(children)}
        </div>
      </blockquote>
    </div>
  )
}


function textFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children)
  return ''
}

function Pre({ children }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false)
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null)
  const codeElement = Children.toArray(children).find(
    (child): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child),
  )
  const languageClass = codeElement?.props.className
  const language = languageClass?.match(/(?:^|\s)language-([\w-]+)/)?.[1] ?? 'code'
  const codeText = textFromNode(codeElement?.props.children ?? children).replace(/\n$/, '')

  useEffect(() => {
    let cancelled = false
    highlightCode(codeText, language).then(
      (html) => { if (!cancelled && html !== null) setHighlighted({ code: codeText, html }) },
      () => undefined, // Highlighting is cosmetic; plain text stays.
    )
    return () => { cancelled = true }
  }, [codeText, language])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const html = highlighted?.code === codeText ? highlighted.html : null

  return (
    <div className="not-prose my-6 overflow-hidden rounded-[var(--radius-md)] bg-[var(--code-bg)] text-[var(--code-text)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/70">
        <span dir="ltr" className="font-mono">{language}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          aria-label={copied ? 'کپی شد' : 'کپی کد'}
          title={copied ? 'کپی شد' : 'کپی کد'}
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Copy aria-hidden="true" className="size-3.5" />
          <span>{copied ? 'کپی شد' : 'کپی'}</span>
        </button>
      </div>
      <pre dir="ltr" className="m-0 overflow-x-auto p-4 text-start text-sm leading-6">
        {html !== null
          ? <code className="hljs block bg-transparent p-0 text-inherit" dangerouslySetInnerHTML={{ __html: html }} />
          : <code className="block bg-transparent p-0 text-inherit">{codeText}</code>}
      </pre>
    </div>
  )
}

function InlineCode({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      dir="ltr"
      className={clsx('rounded-[var(--radius-sm)] bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--text)]', className)}
    >
      {children}
    </code>
  )
}

function Table(props: ComponentPropsWithoutRef<'table'>) {
  const { children, className, ...rest } = props
  return (
    <div className="my-6 max-w-full overflow-x-auto">
      <table {...rest} className={clsx('w-full border-collapse text-start [&_tbody_tr:nth-child(even)]:bg-[var(--surface-alt)]', className)}>
        {children}
      </table>
    </div>
  )
}

function TableHead(props: ComponentPropsWithoutRef<'thead'>) {
  return <thead {...props} className={clsx('sticky top-0 z-10 bg-[var(--surface-strong)]', props.className)} />
}

function TableRow(props: ComponentPropsWithoutRef<'tr'>) {
  return <tr {...props} className={clsx('border-b border-[var(--border-light)]', props.className)} />
}

function TableHeaderCell(props: ComponentPropsWithoutRef<'th'>) {
  return <th {...props} className={clsx('border-b border-[var(--border-strong)] px-3 py-2 text-start font-semibold text-[var(--text)]', props.className)} />
}

function TableCell(props: ComponentPropsWithoutRef<'td'>) {
  return <td {...props} className={clsx('border-b border-[var(--border-light)] px-3 py-2 text-start text-[var(--text)]', props.className)} />
}

function HorizontalRule(props: ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} className={clsx('my-8 border-0 border-t border-[var(--border-light)]', props.className)} />
}

function Details(props: ComponentPropsWithoutRef<'details'>) {
  return <details {...props} className={clsx('my-4 rounded-[var(--radius-sm)] border border-[var(--border-light)] px-4', props.className)} />
}

function Summary(props: ComponentPropsWithoutRef<'summary'>) {
  return <summary {...props} className={clsx('cursor-pointer py-3 text-start font-semibold text-[var(--text)]', props.className)} />
}

const directiveComponents = {
  'mdx-accordion': withMdxErrorBoundary('accordion', MdxAccordion),
  'mdx-item': withMdxErrorBoundary('item', MdxAccordionItem),
  'mdx-alert': withMdxErrorBoundary('alert', Alert),
  'mdx-avatar': withMdxErrorBoundary('avatar', Avatar),
  'mdx-badge': withMdxErrorBoundary('badge', Badge),
  'mdx-breadcrumbs': withMdxErrorBoundary('breadcrumbs', Breadcrumbs),
  'mdx-button': withMdxErrorBoundary('button', Button),
  'mdx-buttons': withMdxErrorBoundary('buttons', Buttons),
  'mdx-card': withMdxErrorBoundary('card', Card),
  'mdx-collapse': withMdxErrorBoundary('collapse', Collapse),
  'mdx-modal': withMdxErrorBoundary('modal', Modal),
  'mdx-gallery': withMdxErrorBoundary('gallery', Gallery),
  'mdx-iconbutton': withMdxErrorBoundary('iconbutton', IconButton),
  'mdx-list': withMdxErrorBoundary('list', List),
  'mdx-pagination': withMdxErrorBoundary('pagination', Pagination),
  'mdx-popover': withMdxErrorBoundary('popover', Popover),
  'mdx-rating': withMdxErrorBoundary('rating', Rating),
  'mdx-select': withMdxErrorBoundary('select', Select),
  'mdx-skeleton': withMdxErrorBoundary('skeleton', Skeleton),
  'mdx-spinner': withMdxErrorBoundary('spinner', Spinner),
  'mdx-switch': withMdxErrorBoundary('switch', Switch),
  'mdx-tooltip': withMdxErrorBoundary('tooltip', Tooltip),
  'mdx-lead': withMdxErrorBoundary('lead', Lead),
  'mdx-video': withMdxErrorBoundary('video', VideoDirective),
  'mdx-audio': withMdxErrorBoundary('audio', AudioDirective),
  'mdx-suggested': withMdxErrorBoundary('suggested', Suggested),
  'mdx-course': withMdxErrorBoundary('course', Course),
  'mdx-embed': withMdxErrorBoundary('embed', SafeEmbed),
  'mdx-youtube': withMdxErrorBoundary('youtube', SafeEmbed),
  'mdx-instagram': withMdxErrorBoundary('instagram', SafeEmbed),
  'mdx-aparat': withMdxErrorBoundary('aparat', SafeEmbed),
  'mdx-source': withMdxErrorBoundary('source', Source),
  'mdx-unknown': withMdxErrorBoundary('unknown', UnknownDirective),
} as unknown as MarkdownComponents

function Honorific({
  file,
  label,
  width,
  height,
  verticalAlign,
}: {
  file?: string
  label?: string
  width?: string
  height?: string
  verticalAlign?: string
}) {
  if (!file || !label || !/^[a-z]+\.svg$/.test(file)) return null

  const imageUrl = `${import.meta.env.BASE_URL}honorifics/${file}`

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="markdown-honorific"
      style={{
        width: width ?? '1.8em',
        height: height ?? '1.8em',
        verticalAlign: verticalAlign ?? '-0.4em',
        maskImage: `url("${imageUrl}")`,
        WebkitMaskImage: `url("${imageUrl}")`,
      }}
    />
  )
}

function Spoiler({
  children,
  animationText,
  hasAnimationDirective = false,
}: {
  children?: ReactNode
  animationText?: string
  hasAnimationDirective?: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const [askAge, setAskAge] = useState(false)
  const [showAnimationText, setShowAnimationText] = useState(false)
  // Screen position (viewport px) the floating phrase starts from: the top of the first line of the censored text.
  const [phraseAnchor, setPhraseAnchor] = useState<{ x: number; y: number } | null>(null)
  const coverRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showAnimationText) return
    const timer = window.setTimeout(() => setShowAnimationText(false), 1800)
    return () => window.clearTimeout(timer)
  }, [showAnimationText])

  function revealText() {
    // Measure before the cover unmounts. The phrase is rendered in a portal on <body> (not inside the text),
    // because quotes use `overflow-hidden` (to clip their side rail) and would cut the phrase off.
    const rect = coverRef.current?.getClientRects()[0]
    if (rect) {
      const margin = 72
      setPhraseAnchor({
        x: Math.min(Math.max(rect.left + rect.width / 2, margin), Math.max(window.innerWidth - margin, margin)),
        y: rect.top,
      })
    } else {
      setPhraseAnchor(null)
    }
    setRevealed(true)
    setShowAnimationText(true)
  }

  function reveal() {
    if (isAdultConfirmed()) {
      revealText()
    } else {
      setAskAge(true)
    }
  }

  function acceptAge() {
    confirmAdultAccess()
    setAskAge(false)
    revealText()
  }

  function declineAge() {
    rejectAdultAccess()
    setAskAge(false)
  }
  const phrase = hasAnimationDirective !== false
    ? (animationText ?? '').trim()
    : 'معذرت می‌خوام'

  return (
    <span className="spoiler-wrap">
      {revealed ? <span className="spoiler-revealed">{children}</span> : (
        <button ref={coverRef} type="button" className="spoiler-cover" onClick={reveal} aria-label="نمایش متن سانسورشده">
          <span aria-hidden="true" className="spoiler-hidden-text">{children}</span>
          <span className="sr-only">برای نمایش متن کلیک کنید</span>
        </button>
      )}
      {showAnimationText && revealed && phraseAnchor && phrase.length > 0 && typeof document !== 'undefined' && createPortal(
        <span
          className="spoiler-animation-phrase"
          aria-hidden="true"
          style={{ left: phraseAnchor.x, top: phraseAnchor.y }}
        >
          {phrase}
        </span>,
        document.body,
      )}
      {askAge && typeof document !== 'undefined' && createPortal(
        <span className="spoiler-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAskAge(false) }}>
          <span className="spoiler-dialog" role="dialog" aria-modal="true" aria-labelledby="spoiler-age-title">
            <span className="spoiler-dialog-icon" aria-hidden="true">18+</span>
            <strong id="spoiler-age-title">آیا ۱۸ سالت هست؟</strong>
            <span className="spoiler-dialog-description">برای نمایش این متن باید ۱۸ سال یا بیشتر داشته باشی.</span>
            <span className="spoiler-dialog-actions">
              <button type="button" className="spoiler-yes" onClick={acceptAge}>بله</button>
              <button type="button" className="spoiler-no" onClick={declineAge}>خیر</button>
            </span>
          </span>
        </span>,
        document.body,
      )}
    </span>
  )
}

const markdownComponents: MarkdownComponents = {
  // The page h1 is the article title: a raw <h1> in the body is rendered as h2.
  // Markdown `#` demotion is handled by remarkHeadingLevels.
  h1: createHeading('h2'),
  h2: createHeading('h2'),
  h3: createHeading('h3'),
  h4: createHeading('h4'),
  h5: createHeading('h5'),
  h6: createHeading('h6'),
  p: Paragraph,
  'mdx-spoiler': Spoiler,
  'mdx-chat': ChatThread,
  'mdx-chatmsg': ChatMessage,
  'mdx-mini': Mini,
  'mdx-emoji': Emoji,
  'mdx-honorific': Honorific,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  code: InlineCode,
  pre: Pre,
  table: Table,
  thead: TableHead,
  tr: TableRow,
  th: TableHeaderCell,
  td: TableCell,
  hr: HorizontalRule,
  img: MarkdownImage,
  video: MarkdownVideo,
  audio: AudioDirective,
  iframe: RawIframe,
  details: Details,
  summary: Summary,
  ...directiveComponents,
}

interface MarkdownRendererProps {
  markdown: string
  className?: string
}

interface RenderedMarkdown {
  source: string
  content?: ReactNode
  error?: string
}

function MarkdownSkeleton() {
  return (
    <div aria-label="در حال آماده‌سازی متن" aria-busy="true" className="animate-pulse space-y-4 py-2">
      <div className="h-7 w-2/5 rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
      <div className="h-4 w-full rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
      <div className="h-4 w-11/12 rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
      <div className="h-4 w-4/5 rounded-[var(--radius-sm)] bg-[var(--surface-strong)]" />
    </div>
  )
}

export function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  const processor = useMemo(() => createMarkdownProcessor(markdownComponents), [])
  const [rendered, setRendered] = useState<RenderedMarkdown | null>(null)

  useEffect(() => {
    let cancelled = false

    void processor.process(normalizeQuotes(normalizeDirectiveFences(markdown))).then(
      (file) => {
        if (!cancelled) setRendered({ source: markdown, content: file.result as ReactNode })
      },
      (error: unknown) => {
        if (!cancelled) {
          setRendered({
            source: markdown,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [markdown, processor])

  if (rendered?.source !== markdown) return <MarkdownSkeleton />
  if (rendered.error) {
    return <p role="alert" className="text-start text-[var(--danger)]">امکان نمایش متن وجود ندارد: {rendered.error}</p>
  }

  return (
    <div
      className={clsx(
        'article-body prose max-w-none text-start [--tw-prose-body:var(--text)] [--tw-prose-headings:var(--text)] [--tw-prose-links:var(--info)] [--tw-prose-bold:var(--text)] [--tw-prose-bullets:var(--brand)] [--tw-prose-counters:var(--brand)] [--tw-prose-quotes:var(--text-muted)] [--tw-prose-quote-borders:var(--border-strong)] [--tw-prose-hr:var(--border-light)] [--tw-prose-captions:var(--text-muted)] [--tw-prose-th-borders:var(--border-strong)] [--tw-prose-td-borders:var(--border-light)]',
        'prose-headings:text-start prose-p:text-start prose-ul:ps-6 prose-ol:ps-6',
        'prose-li:ps-1',
        className,
      )}
    >
      {rendered.content}
    </div>
  )
}