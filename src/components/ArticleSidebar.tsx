import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Copy, Link2, Send, Share2, X } from 'lucide-react'
import type { ArticleMeta } from '../lib/types'
import siteConfig from '../site.config'
import { AdultArticleNotice } from './AdultArticleNotice'
import { useAdultAccess } from '../lib/adultAccess'

function SidebarCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 text-[var(--text)] xl:p-7">
      <h2 className="mb-4 flex items-center gap-2 text-start text-base font-bold"><span className="text-[var(--brand)]">{icon}</span>{title}</h2>
      {children}
    </section>
  )
}

export function ArticleSidebar({ articles, article }: { articles: ArticleMeta[]; article: ArticleMeta }) {
  const [copied, setCopied] = useState(false)
  const adultConfirmed = useAdultAccess()
  const articleIndex = articles.findIndex((item) => item.slug === article.slug)
  const previous = articles.slice(Math.max(0, articleIndex - 5), articleIndex).reverse()
  const next = articles.slice(articleIndex + 1, articleIndex + 6)
  const latest = articles.slice(0, 5)
  const currentUrl = `${siteConfig.siteUrl}/blog/${article.slug}`
  const encodedUrl = encodeURIComponent(currentUrl)
  const encodedTitle = encodeURIComponent(article.title)

  async function copyLink() {
    await navigator.clipboard.writeText(currentUrl).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <aside aria-label="اطلاعات تکمیلی مقاله" className="grid content-start gap-4">
      <SidebarCard title="جدیدترین نوشته‌ها" icon={<BookOpen aria-hidden="true" className="size-4" />}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {latest.map((item) => <li key={item.slug}><Link to={`/blog/${item.slug}`} aria-label={item.adult && !adultConfirmed ? 'مشاهده مقاله +۱۸' : item.title} className="block rounded-[var(--radius-sm)] bg-[var(--surface-alt)] px-3 py-2.5 text-start text-sm leading-6 text-[var(--text)] no-underline hover:border hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]">{item.adult && !adultConfirmed ? <span className="relative block"><span className="block select-none blur-sm">{item.title}</span><span className="absolute inset-0 flex items-center justify-center"><AdultArticleNotice compact /></span></span> : item.title}</Link></li>)}
        </ul>
      </SidebarCard>

      {previous.length > 0 && <SidebarCard title="مقالات پیشین" icon={<ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />}>
        <ul className="m-0 grid list-none gap-3 p-0">
          {previous.map((item) => <li key={item.slug}><ArticleNeighbor article={item} current={item.slug === article.slug} /></li>)}
        </ul>
      </SidebarCard>}

      {next.length > 0 && <SidebarCard title="مقالات بعدی" icon={<ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />}>
        <ul className="m-0 grid list-none gap-3 p-0">
          {next.map((item) => <li key={item.slug}><ArticleNeighbor article={item} current={item.slug === article.slug} /></li>)}
        </ul>
      </SidebarCard>}

      <SidebarCard title="اشتراک‌گذاری" icon={<Share2 aria-hidden="true" className="size-4" />}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void copyLink()} aria-label={copied ? 'پیوند کپی شد' : 'کپی پیوند'} title={copied ? 'کپی شد' : 'کپی پیوند'} className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--brand)] hover:text-[var(--brand-contrast)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"><Copy aria-hidden="true" className="size-4" /></button>
          <ShareLink href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} label="اشتراک در تلگرام"><Send aria-hidden="true" className="size-4" /></ShareLink>
          <ShareLink href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} label="اشتراک در ایکس"><X aria-hidden="true" className="size-4" /></ShareLink>
          <ShareLink href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} label="اشتراک در لینکدین"><Link2 aria-hidden="true" className="size-4" /></ShareLink>
          {typeof navigator !== 'undefined' && 'share' in navigator && <button type="button" onClick={() => void navigator.share({ title: article.title, url: currentUrl }).catch(() => undefined)} aria-label="اشتراک‌گذاری" className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--info)] hover:text-[var(--brand-contrast)]"><Share2 aria-hidden="true" className="size-4" /></button>}
        </div>
        {copied && <p role="status" className="mb-0 mt-2 text-xs text-[var(--success)]">پیوند کپی شد</p>}
      </SidebarCard>

      {siteConfig.sidebarCards.map((card) => <SidebarCard key={card.title} title={card.title} icon={<Share2 aria-hidden="true" className="size-4" />}>
        <Link to={card.href} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-light)] p-3 text-start no-underline hover:border-[var(--border-strong)]">
          <span className="min-w-0 flex-1"><span className="block text-xs text-[var(--muted)]">{card.text}</span><strong className="mt-1 block text-sm text-[var(--text)]">{card.title}</strong></span>
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0 text-[var(--brand)] rtl:rotate-180" />
        </Link>
      </SidebarCard>)}
    </aside>
  )
}

function ArticleNeighbor({ article, current }: { article: ArticleMeta; current: boolean }) {
  const adultConfirmed = useAdultAccess()
  const censored = article.adult === true && !adultConfirmed
  return (
    <Link to={`/blog/${article.slug}`} aria-current={current ? 'page' : undefined} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--surface-alt)] p-2.5 text-start no-underline hover:bg-[var(--surface-strong)]">
      {article.cover?.type === 'image' && <img src={article.cover.url} alt="" loading="lazy" decoding="async" className={`size-12 shrink-0 rounded-[var(--radius-sm)] object-cover ${censored ? 'blur-md' : ''}`} />}
      <span className="relative line-clamp-2 text-sm leading-6 text-[var(--text)]">{censored ? <><span className="block select-none blur-sm">{article.title}</span><span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">حاوی جملات +۱۸</span></> : article.title}</span>
    </Link>
  )
}

function ShareLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--info)] hover:text-[var(--brand-contrast)] focus-visible:outline-2 focus-visible:outline-[var(--info)]">{children}</a>
}