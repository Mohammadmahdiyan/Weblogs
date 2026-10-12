import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import siteConfig from '../site.config'
import { ThemeToggle } from './ThemeControls'
import { FontControls } from './FontControls'
import { StyleSwitcher } from './StyleSwitcher'
import type { ArticleMeta } from '../lib/types'

function SiteLink({ href, children, className, onClick }: { href: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return href.startsWith('/')
    ? <Link to={href} onClick={onClick} className={className}>{children}</Link>
    : <a href={href} onClick={onClick} className={className}>{children}</a>
}

function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('announcement-dismissed') === 'true')
  if (!siteConfig.announcement.enabled || dismissed) return null

  function dismiss() {
    sessionStorage.setItem('announcement-dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div className="relative bg-[var(--brand)] px-12 py-2 text-center text-sm text-[var(--brand-contrast)]">
      <SiteLink href={siteConfig.announcement.linkHref} className="font-medium underline underline-offset-4">
        {siteConfig.announcement.text} <span className="mx-1">·</span>{siteConfig.announcement.linkText}
      </SiteLink>
      <button type="button" onClick={dismiss} aria-label="بستن پیام" className="absolute end-3 top-2 rounded-[var(--radius-sm)] p-1 focus-visible:outline-2 focus-visible:outline-[var(--brand-contrast)]">
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    drawerRef.current?.querySelector<HTMLElement>('a,button')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a,button:not([disabled])'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={onClose}>
      <nav ref={drawerRef} role="dialog" aria-modal="true" aria-label="فهرست اصلی" onClick={(event) => event.stopPropagation()} className="absolute inset-y-0 end-0 flex w-[min(88vw,22rem)] flex-col gap-6 border-s border-[var(--border-light)] bg-[var(--surface)] p-5 text-[var(--text)]">
        <div className="flex items-center justify-between">
          <span className="font-bold">{siteConfig.siteName}</span>
          <button type="button" onClick={onClose} aria-label="بستن فهرست" className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--surface-alt)]"><X aria-hidden="true" className="size-5" /></button>
        </div>
        <div className="grid gap-2">
          {siteConfig.nav.map((item) => <SiteLink key={item.href} href={item.href} onClick={onClose} className="rounded-[var(--radius-sm)] px-3 py-3 text-start hover:bg-[var(--surface-alt)]">{item.label}</SiteLink>)}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-light)] pt-4">
          <ThemeToggle />
          <FontControls />
        </div>
      </nav>
    </div>
  )
}

function Header({ articles }: { articles: ArticleMeta[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
          <Link to="/" className="shrink-0 text-lg font-extrabold text-[var(--text)] no-underline sm:text-xl">{siteConfig.siteName}</Link>
          <nav aria-label="پیمایش اصلی" className="hidden items-center gap-7 md:flex">
            {siteConfig.nav.map((item) => <SiteLink key={item.href} href={item.href} className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--brand)]">{item.label}</SiteLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <ThemeToggle />
              <details className="group relative">
                <summary className="cursor-pointer list-none rounded-[var(--radius-sm)] border border-[var(--border-light)] px-3 py-2 text-sm text-[var(--text-secondary)]">تنظیم متن</summary>
                <div className="absolute end-0 top-full z-10 mt-2 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
                  <FontControls />
                </div>
              </details>
            </div>
            <StyleSwitcher articles={articles} />
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="بازکردن فهرست" className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-light)] text-[var(--text)] hover:bg-[var(--surface-alt)] md:hidden">
              <Menu aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </header>
      {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  )
}

function Footer({ articles }: { articles: ArticleMeta[] }) {
  const latest = articles.slice(0, 4)
  return (
    <footer className="mx-auto my-8 w-full max-w-7xl px-4 sm:px-6">
      <div className="relative rounded-[var(--radius-lg)] bg-[var(--footer-bg,var(--text))] p-6 text-[var(--footer-text,var(--surface))] sm:p-8">
        <span aria-hidden="true" className="absolute -top-2 end-5 hidden size-10 translate-x-1/2 -translate-y-1/2 rotate-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[var(--brand-contrast)] sm:flex">
          {/* open book: knowledge / reading */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6 -rotate-6">
            <path d="M12 6.5C10.4 5.3 8.2 4.7 5.5 4.7c-.9 0-1.7.1-2.5.3v13.2c.8-.2 1.6-.3 2.5-.3 2.7 0 4.9.6 6.5 1.8 1.6-1.2 3.8-1.8 6.5-1.8.9 0 1.7.1 2.5.3V5c-.8-.2-1.6-.3-2.5-.3-2.7 0-4.9.6-6.5 1.8Z" />
            <path d="M12 6.5V20" />
          </svg>
        </span>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <section>
            <h2 className="mb-3 text-base font-bold">{siteConfig.siteName}</h2>
            <p className="m-0 text-sm leading-7 opacity-75">{siteConfig.siteDescription}</p>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold">پیوندهای مفید</h2>
            <ul className="m-0 grid list-none gap-2 p-0">
              {siteConfig.footerLinks.map((item) => <li key={item.href}><SiteLink href={item.href} className="text-sm opacity-75 no-underline hover:opacity-100">{item.label}</SiteLink></li>)}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold">نوشته‌های پیشنهادی</h2>
            <ul className="m-0 grid list-none gap-2 p-0">
              {latest.map((article) => <li key={article.slug}><Link to={`/blog/${article.slug}`} className="line-clamp-2 text-sm opacity-75 no-underline hover:opacity-100">{article.title}</Link></li>)}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold">شبکه‌های اجتماعی</h2>
            <ul className="m-0 grid list-none gap-2 p-0">
              {siteConfig.social.map((item) => <li key={item.href}><a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm opacity-75 no-underline hover:opacity-100">{item.label}</a></li>)}
              {siteConfig.social.length === 0 && <li className="text-sm opacity-60">پیوندی ثبت نشده است</li>}
            </ul>
          </section>
        </div>
        <div className="mt-8 rounded-[var(--radius-sm)] bg-white/10 px-4 py-3 text-center text-xs text-white/70">
          © {new Date().getFullYear()} {siteConfig.siteName}
        </div>
      </div>
    </footer>
  )
}

export function SiteShell({ children, articles }: { children: ReactNode; articles: ArticleMeta[] }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-sm)] focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-[var(--brand-contrast)]">پرش به محتوای اصلی</a>
      <AnnouncementBar />
      <Header articles={articles} />
      {children}
      <Footer articles={articles} />
    </div>
  )
}

export function DirectionArrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden="true" className={clsx('size-4 rtl:rotate-180', className)} />
}

export function NextArrow({ className }: { className?: string }) {
  return <ArrowRight aria-hidden="true" className={clsx('size-4 rtl:rotate-180', className)} />
}