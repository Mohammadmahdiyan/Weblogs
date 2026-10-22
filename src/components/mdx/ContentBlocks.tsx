import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Download,
  ExternalLink,
  Heart,
  Home,
  Info,
  Menu,
  Minus,
  Play,
  Plus,
  Search,
  Share2,
  Star,
  TriangleAlert,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { ImageWithFallback } from '../ImageWithFallback'

const surfaceCallout = 'not-prose rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[color-mix(in_srgb,var(--text)_2%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--text)_4%,transparent)]'

const toneClasses: Record<string, string> = {
  blue: 'bg-[color-mix(in_srgb,var(--info)_10%,transparent)] text-[var(--info)]',
  info: 'bg-[color-mix(in_srgb,var(--info)_10%,transparent)] text-[var(--info)]',
  green: 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]',
  success: 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]',
  yellow: 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]',
  warning: 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]',
  red: 'bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]',
  danger: 'bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]',
  brand: 'bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]',
}

const buttonToneClasses: Record<string, string> = {
  blue: 'border-[var(--info)] bg-[var(--info)] text-[var(--surface)]',
  info: 'border-[var(--info)] bg-[var(--info)] text-[var(--surface)]',
  green: 'border-[var(--success)] bg-[var(--success)] text-[var(--surface)]',
  success: 'border-[var(--success)] bg-[var(--success)] text-[var(--surface)]',
  yellow: 'border-[var(--warning)] bg-[var(--warning)] text-[var(--surface)]',
  warning: 'border-[var(--warning)] bg-[var(--warning)] text-[var(--surface)]',
  red: 'border-[var(--danger)] bg-[var(--danger)] text-[var(--surface)]',
  danger: 'border-[var(--danger)] bg-[var(--danger)] text-[var(--surface)]',
  brand: 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]',
}

const outlinedToneClasses: Record<string, string> = {
  blue: 'border-[var(--info)] text-[var(--info)]',
  info: 'border-[var(--info)] text-[var(--info)]',
  green: 'border-[var(--success)] text-[var(--success)]',
  success: 'border-[var(--success)] text-[var(--success)]',
  yellow: 'border-[var(--warning)] text-[var(--warning)]',
  warning: 'border-[var(--warning)] text-[var(--warning)]',
  red: 'border-[var(--danger)] text-[var(--danger)]',
  danger: 'border-[var(--danger)] text-[var(--danger)]',
  brand: 'border-[var(--brand)] text-[var(--brand)]',
}

const textToneClasses: Record<string, string> = {
  blue: 'text-[var(--info)]',
  info: 'text-[var(--info)]',
  green: 'text-[var(--success)]',
  success: 'text-[var(--success)]',
  yellow: 'text-[var(--warning)]',
  warning: 'text-[var(--warning)]',
  red: 'text-[var(--danger)]',
  danger: 'text-[var(--danger)]',
  brand: 'text-[var(--brand)]',
}

function LinkOrAnchor({ href, children, className, variant }: { href?: string; children: ReactNode; className?: string; variant?: string }) {
  if (href?.startsWith('/')) {
    return <Link to={href} className={className} data-variant={variant}>{children}</Link>
  }
  const external = typeof href === 'string' && /^https?:\/\//i.test(href)
  return <a href={href || '#'} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className={className} data-variant={variant}>{children}</a>
}

export function Alert({ type = 'info', children }: { type?: string; children?: ReactNode }) {
  const style = toneClasses[type] ? type : 'info'
  const Icon = style === 'success' || style === 'green'
    ? CircleCheck
    : style === 'warning' || style === 'yellow'
      ? TriangleAlert
      : style === 'danger' || style === 'red'
        ? CircleAlert
        : Info

  return (
    <aside role="note" className={clsx('not-prose my-5 flex gap-3 border-s-4 p-4 text-sm leading-6', surfaceCallout, toneClasses[style])}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 text-start">{children}</div>
    </aside>
  )
}

export function Avatar({ src, name = '', size = 'md' }: { src?: string; name?: string; size?: string }) {
  const sizeClass = size === 'sm' ? 'size-8 text-xs' : size === 'lg' ? 'size-14 text-lg' : 'size-10 text-sm'
  const initials = Array.from(name.trim())[0] ?? '?'
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-strong)] font-semibold text-[var(--text)]', sizeClass)}>
      {src ? <ImageWithFallback src={src} alt={name} loading="lazy" decoding="async" className="size-full object-cover" fallbackClassName="!aspect-auto size-full" /> : initials}
    </span>
  )
}

export function Badge({ children, color = 'brand' }: { children?: ReactNode; color?: string }) {
  const tone = toneClasses[color] ? color : 'brand'
  return <span className={clsx('not-prose inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold', toneClasses[tone])}>{children}</span>
}

export function Breadcrumbs({ children }: { children?: ReactNode }) {
  return (
    <nav aria-label="مسیر صفحه" className="not-prose my-4 text-sm text-[var(--text-muted)] [&_ol]:m-0 [&_ol]:flex [&_ol]:flex-wrap [&_ol]:items-center [&_ol]:gap-2 [&_ol]:p-0 [&_ul]:m-0 [&_ul]:flex [&_ul]:flex-wrap [&_ul]:items-center [&_ul]:gap-2 [&_ul]:list-none [&_ul]:p-0">
      {children}
    </nav>
  )
}

export function Button({
  href,
  variant = 'filled',
  color = 'brand',
  children,
}: {
  href?: string
  variant?: string
  color?: string
  children?: ReactNode
}) {
  const tone = buttonToneClasses[color] ? color : 'brand'
  const variantClass = variant === 'outlined'
    ? clsx('border bg-transparent', outlinedToneClasses[tone])
    : variant === 'text'
      ? clsx('border border-transparent bg-transparent', textToneClasses[tone])
      : buttonToneClasses[tone]
  const className = clsx('md-button not-prose inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]', variantClass)

  return href
    ? <LinkOrAnchor href={href} className={className} variant={variant}>{children}</LinkOrAnchor>
    : <button type="button" data-variant={variant} className={className}>{children}</button>
}

export function Buttons({ children }: { children?: ReactNode }) {
  return <div role="group" className="not-prose my-4 flex flex-wrap items-center gap-2">{children}</div>
}

export function Card({ title, image, children }: { title?: string; image?: string; children?: ReactNode }) {
  return (
    <section className={clsx('not-prose my-5 overflow-hidden border text-[var(--text)]', surfaceCallout)}>
      {image && <ImageWithFallback src={image} alt="" loading="lazy" decoding="async" className="aspect-video w-full object-cover" />}
      <div className="p-4 sm:p-5">
        {title && <h3 className="mb-2 text-start text-base font-semibold text-[var(--text)]">{title}</h3>}
        <div className="text-start text-sm leading-7 text-[var(--text-muted)]">{children}</div>
      </div>
    </section>
  )
}

export function Collapse({ title = 'نمایش جزئیات', children }: { title?: string; children?: ReactNode }) {
  return (
    <details className={clsx('not-prose my-4 border px-4', surfaceCallout)}>
      <summary className="cursor-pointer py-3 text-start font-semibold text-[var(--text)]">{title}</summary>
      <div className="pb-4 text-start text-sm leading-7 text-[var(--text-muted)]">{children}</div>
    </details>
  )
}

export function Lead({ children }: { children?: ReactNode }) {
  return <div className="my-6 text-start text-lg leading-8 text-[var(--text-muted)] sm:text-xl">{children}</div>
}

export function List({ variant = 'bullet', children }: { variant?: string; children?: ReactNode }) {
  const listStyle = variant === 'number'
    ? '[&_ol]:list-decimal [&_ul]:list-decimal'
    : variant === 'check'
      ? '[&_ul]:list-none [&_ul]:ps-0 [&_ol]:list-none [&_ol]:ps-0 [&_li]:relative [&_li]:ps-7 [&_li]:before:absolute [&_li]:before:start-0 [&_li]:before:font-bold [&_li]:before:text-[var(--success)] [&_li]:before:content-["✓"]'
      : '[&_ol]:list-disc [&_ul]:list-disc'
  return <div className={clsx('my-4 text-start [&_li]:my-2 [&_ol]:ps-6 [&_ul]:ps-6', listStyle)}>{children}</div>
}

export function Pagination({ total = '1', current = '1' }: { total?: string; current?: string }) {
  const count = Math.max(1, Math.min(100, Number.parseInt(total, 10) || 1))
  const activePage = Math.max(1, Math.min(count, Number.parseInt(current, 10) || 1))
  const pageCount = Math.min(count, 7)
  const firstPage = Math.max(1, Math.min(activePage - 3, count - pageCount + 1))
  const pages = Array.from({ length: pageCount }, (_unused, index) => firstPage + index)

  return (
    <nav aria-label="صفحه‌بندی" className="not-prose my-5 flex flex-wrap items-center gap-1">
      <button type="button" disabled aria-label="صفحه قبل" className="rounded-[var(--radius-sm)] border border-[var(--border-light)] px-3 py-2 text-[var(--text-muted)] disabled:opacity-50"><ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" /></button>
      {pages.map((page) => (
        <button key={page} type="button" disabled aria-current={page === activePage ? 'page' : undefined} className={clsx('min-h-9 min-w-9 rounded-[var(--radius-sm)] border px-2 py-1 text-sm', page === activePage ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]' : 'border-[var(--border-light)] text-[var(--text)]')}>
          {page}
        </button>
      ))}
      <button type="button" disabled aria-label="صفحه بعد" className="rounded-[var(--radius-sm)] border border-[var(--border-light)] px-3 py-2 text-[var(--text-muted)] disabled:opacity-50"><ArrowRight aria-hidden="true" className="size-4" /></button>
    </nav>
  )
}

export function Popover({ children, content = '' }: { children?: ReactNode; content?: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="not-prose relative inline-block">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)} className="min-h-9 rounded-[var(--radius-sm)] border border-[var(--border-light)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">{children}</button>
      <span id={id} role="status" hidden={!open} className="absolute end-0 top-full z-10 mt-2 block w-56 rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--surface)] p-3 text-start text-sm text-[var(--text)]">{content}</span>
    </span>
  )
}

export function Rating({ value = '0', max = '5' }: { value?: string; max?: string }) {
  const numericValue = Math.max(0, Number.parseFloat(value) || 0)
  const numericMax = Math.max(1, Math.min(10, Number.parseInt(max, 10) || 5))
  return (
    <span className="not-prose inline-flex items-center gap-0.5 text-[var(--warning)]" role="img" aria-label={`امتیاز ${numericValue} از ${numericMax}`}>
      {Array.from({ length: numericMax }, (_unused, index) => <span key={index} aria-hidden="true" className={index < Math.ceil(numericValue) ? 'opacity-100' : 'opacity-40'}>★</span>)}
      <span className="ms-2 text-sm text-[var(--text-muted)]">{numericValue}/{numericMax}</span>
    </span>
  )
}

export function Select({ options = '' }: { options?: string }) {
  const values = options.split(',').map((option) => option.trim()).filter(Boolean)
  return (
    <select aria-label="گزینه‌ها" disabled defaultValue={values[0] ?? ''} className="not-prose my-2 min-h-10 max-w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-start text-sm text-[var(--text)] disabled:opacity-80">
      {values.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

export function Skeleton({ lines = '3' }: { lines?: string }) {
  const lineCount = Math.max(1, Math.min(8, Number.parseInt(lines, 10) || 3))
  return (
    <div aria-label="در حال بارگذاری" aria-busy="true" className="not-prose my-4 space-y-3">
      {Array.from({ length: lineCount }, (_unused, index) => <div key={index} className={clsx('h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-strong)]', index === lineCount - 1 && 'w-3/5')} />)}
    </div>
  )
}

export function Spinner({ size = 'md' }: { size?: string }) {
  const sizeClass = size === 'sm' ? 'size-4 border-2' : size === 'lg' ? 'size-9 border-4' : 'size-6 border-[3px]'
  return <span role="status" aria-label="در حال بارگذاری" className={clsx('not-prose inline-block animate-spin rounded-[var(--radius-pill)] border-[var(--brand)] border-s-transparent motion-reduce:animate-none', sizeClass)} />
}

export function Switch({ label = '', checked = false }: { label?: string; checked?: boolean | string }) {
  const [isChecked, setIsChecked] = useState(checked === true || checked === 'true')
  const id = useId()
  return (
    <label htmlFor={id} className="not-prose my-2 inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm text-[var(--text)]">
      <input id={id} type="checkbox" role="switch" checked={isChecked} onChange={(event) => setIsChecked(event.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="relative h-6 w-11 rounded-[var(--radius-pill)] bg-[var(--surface-strong)] transition-colors peer-checked:bg-[var(--brand)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--info)] after:absolute after:start-1 after:top-1 after:size-4 after:rounded-[var(--radius-pill)] after:bg-[var(--surface)] after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none" />
      <span>{label}</span>
    </label>
  )
}

export function Tooltip({ children, text = '' }: { children?: ReactNode; text?: string }) {
  const id = useId()
  return (
    <span className="not-prose group relative inline-flex" tabIndex={0} aria-describedby={id}>
      <span className="cursor-help border-b border-dotted border-[var(--border-strong)]">{children}</span>
      <span id={id} role="tooltip" className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-2 w-max max-w-60 -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--text)] opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">{text}</span>
    </span>
  )
}

export function Suggested({ href = '#', label = 'مقاله پیشنهادی:', children }: { href?: string; label?: string; children?: ReactNode }) {
  return (
    <aside className={clsx(surfaceCallout, 'my-5 flex flex-wrap items-center gap-3 p-3 sm:p-4')}>
      <span className="shrink-0 text-sm font-semibold text-[var(--info)]">{label}</span>
      <LinkOrAnchor href={href} className="m-0 text-sm font-medium text-[var(--text)] no-underline hover:text-[var(--brand)]">{children}</LinkOrAnchor>
    </aside>
  )
}

export function Course({
  title = '', href = '#', image = '', label = 'دوره پیشنهادی', cta = 'مشاهده دوره', children,
}: {
  title?: string; href?: string; image?: string; label?: string; cta?: string; children?: ReactNode
}) {
  return (
    <aside className={clsx(surfaceCallout, 'my-5 flex flex-col items-center gap-4 p-3 text-center sm:flex-row sm:p-4 sm:text-start')}>
      {image && <ImageWithFallback src={image} alt="" loading="lazy" decoding="async" className="aspect-video w-full shrink-0 rounded-[var(--radius-sm)] object-cover sm:w-40" fallbackClassName="aspect-video w-full shrink-0 rounded-[var(--radius-sm)] sm:w-40" />}
      <div className="min-w-0 flex-1">
        <span className="mb-2 inline-flex rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--brand)]">{label}</span>
        <LinkOrAnchor href={href} className="block text-sm font-semibold text-[var(--text)] no-underline hover:text-[var(--brand)]">{title || children}</LinkOrAnchor>
        {title && children && <div className="mt-1 text-sm text-[var(--text-muted)]">{children}</div>}
      </div>
      <LinkOrAnchor href={href} className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--info)_10%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--info)] no-underline">
        {cta}<ArrowRight aria-hidden="true" className="size-3.5 rtl:rotate-180" />
      </LinkOrAnchor>
    </aside>
  )
}

export function UnknownDirective({ directiveName = 'unknown', children }: { directiveName?: string; children?: ReactNode }) {
  if (!import.meta.env.DEV) return <>{children}</>
  return (
    <div role="note" className="not-prose my-3 border border-dashed border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3 text-sm text-[var(--text)]">
      دستور ناشناخته: <code>{directiveName}</code>{children}
    </div>
  )
}

export function IconButton({ iconName = 'arrow-right', href = '#', children }: { iconName?: string; href?: string; children?: ReactNode }) {
  const iconMap = {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    ChevronDown,
    CircleAlert,
    CircleCheck,
    Download,
    ExternalLink,
    Heart,
    Home,
    Info,
    Menu,
    Minus,
    Play,
    Plus,
    Search,
    Share2,
    Star,
    X,
  }
  const iconKey = iconName.replace(/[-_ ]+([a-z])/g, (_match, letter: string) => letter.toUpperCase())
  const normalizedIcon = `${iconKey.charAt(0).toUpperCase()}${iconKey.slice(1)}`
  const Icon = iconMap[normalizedIcon as keyof typeof iconMap] ?? ArrowRight
  return (
    <LinkOrAnchor href={href} className="not-prose inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-light)] text-[var(--text)] hover:bg-[var(--surface-alt)] focus-visible:outline-2 focus-visible:outline-[var(--info)]" aria-label={typeof children === 'string' ? children : `دکمه ${iconName}`}>
      <Icon aria-hidden="true" className="size-4" />
    </LinkOrAnchor>
  )
}
