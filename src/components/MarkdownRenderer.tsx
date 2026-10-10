import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { Copy, ExternalLink, Link2 } from 'lucide-react'
import { useLightbox } from '../lib/lightbox'
import { createMarkdownProcessor, type MarkdownComponents } from '../lib/markdown'

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
            className="absolute -start-6 top-1 hidden text-gray-400 group-hover:inline-flex group-focus-within:inline-flex dark:text-gray-500"
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
  const safeRel = isExternal
    ? clsx(rel, 'noopener noreferrer')
    : rel

  return (
    <a
      {...props}
      href={href}
      target={safeTarget}
      rel={safeRel}
      className={clsx('text-teal-700 underline decoration-teal-700/40 underline-offset-4 dark:text-teal-300', className)}
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
  return <li {...props} className={clsx('ps-1 marker:text-teal-700 dark:marker:text-teal-300', props.className)} />
}

function Blockquote(props: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote
      {...props}
      className={clsx('border-s-4 border-teal-700/50 ps-4 text-start dark:border-teal-300/50', props.className)}
    />
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
  const codeElement = Children.toArray(children).find(
    (child): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child),
  )
  const languageClass = codeElement?.props.className
  const language = languageClass?.match(/(?:^|\s)language-([\w-]+)/)?.[1] ?? 'code'
  const codeText = textFromNode(codeElement?.props.children ?? children)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2 text-xs text-gray-300">
        <span dir="ltr" className="font-mono">{language}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          aria-label={copied ? 'کپی شد' : 'کپی کد'}
          title={copied ? 'کپی شد' : 'کپی کد'}
          className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
        >
          <Copy aria-hidden="true" className="size-3.5" />
          <span>{copied ? 'کپی شد' : 'کپی'}</span>
        </button>
      </div>
      <pre dir="ltr" className="m-0 overflow-x-auto p-4 text-start text-sm leading-6">
        {children}
      </pre>
    </div>
  )
}

function InlineCode({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      dir="ltr"
      className={clsx('rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-gray-800', className)}
    >
      {children}
    </code>
  )
}

function Table(props: ComponentPropsWithoutRef<'table'>) {
  const { children, className, ...rest } = props
  return (
    <div className="my-6 max-w-full overflow-x-auto">
      <table {...rest} className={clsx('w-full border-collapse text-start', className)}>
        {children}
      </table>
    </div>
  )
}

function HorizontalRule(props: ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} className={clsx('my-8 border-0 border-t border-gray-300 dark:border-gray-700', props.className)} />
}

function Image({ src, alt = '', width, height, title, className, style, ...props }: ComponentPropsWithoutRef<'img'>) {
  const openLightbox = useLightbox()
  const dimensions = width && height ? { aspectRatio: `${width} / ${height}` } : undefined

  return (
    <button
      type="button"
      onClick={() => src && openLightbox({ url: src, type: 'image', alt })}
      aria-label={alt ? `نمایش تصویر: ${alt}` : 'نمایش تصویر'}
      className="my-4 block max-w-full cursor-zoom-in overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
    >
      <img
        {...props}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        style={{ ...style, ...dimensions }}
        className={clsx('h-auto max-w-full', className)}
      />
    </button>
  )
}

function Video({ src, onClick, className, ...props }: ComponentPropsWithoutRef<'video'>) {
  const openLightbox = useLightbox()
  return (
    <video
      {...props}
      src={src}
      onClick={(event) => {
        onClick?.(event)
        if (src) openLightbox({ url: src, type: 'video' })
      }}
      className={clsx('my-4 max-h-[80vh] w-full rounded-lg bg-black', className)}
    />
  )
}

function Audio(props: ComponentPropsWithoutRef<'audio'>) {
  return <audio {...props} controls className={clsx('my-4 w-full', props.className)} />
}

function Iframe({ title, className, ...props }: ComponentPropsWithoutRef<'iframe'>) {
  return (
    <div className="not-prose my-6 aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
      <iframe
        {...props}
        title={title || 'Embedded media'}
        loading="lazy"
        className={clsx('size-full border-0', className)}
      />
    </div>
  )
}

function Details(props: ComponentPropsWithoutRef<'details'>) {
  return <details {...props} className={clsx('my-4 rounded-lg border border-gray-200 px-4 dark:border-gray-700', props.className)} />
}

function Summary(props: ComponentPropsWithoutRef<'summary'>) {
  return <summary {...props} className={clsx('cursor-pointer py-3 text-start font-semibold', props.className)} />
}

const markdownComponents: MarkdownComponents = {
  h1: createHeading('h2'),
  h2: createHeading('h3'),
  h3: createHeading('h4'),
  h4: createHeading('h5'),
  h5: createHeading('h6'),
  h6: createHeading('h6'),
  p: Paragraph,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  code: InlineCode,
  pre: Pre,
  table: Table,
  hr: HorizontalRule,
  img: Image,
  video: Video,
  audio: Audio,
  iframe: Iframe,
  details: Details,
  summary: Summary,
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
      <div className="h-7 w-2/5 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 w-11/12 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}

export function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  const processor = useMemo(() => createMarkdownProcessor(markdownComponents), [])
  const [rendered, setRendered] = useState<RenderedMarkdown | null>(null)

  useEffect(() => {
    let cancelled = false

    void processor.process(markdown).then(
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
    return <p role="alert" className="text-start text-red-700 dark:text-red-300">امکان نمایش متن وجود ندارد: {rendered.error}</p>
  }

  return (
    <article
      dir="rtl"
      className={clsx(
        'prose prose-neutral max-w-none text-start dark:prose-invert',
        'prose-headings:text-start prose-p:text-start prose-ul:ps-6 prose-ol:ps-6',
        'prose-blockquote:border-s-4 prose-blockquote:ps-4 prose-li:ps-1',
        className,
      )}
    >
      {rendered.content}
    </article>
  )
}