import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Send } from 'lucide-react'
import { telegramUsername, unlockUrl } from '../lib/followUp'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'

/** Shown for an article whose md says `show: false`: its text is not part of the online site at all. */
export function HiddenArticlePage({ slug }: { slug: string }) {
  usePageMeta({ title: 'این صفحه قفل است', description: 'مدیر اجازهٔ نمایش این صفحه را نمی‌دهد.' })
  const href = useMemo(() => {
    const username = telegramUsername(siteConfig.social)
    return username ? unlockUrl(username, `${siteConfig.siteUrl.replace(/\/$/, '')}/blog/${slug}`) : null
  }, [slug])

  return (
    <main id="main-content" className="mx-auto grid min-h-[55vh] max-w-3xl content-center justify-items-center px-4 py-16 text-center">
      <span aria-hidden="true" className="mb-4 grid size-14 place-items-center rounded-full bg-[var(--surface-alt)] text-[var(--brand)]"><Lock className="size-7" /></span>
      <h1 className="mb-3 text-2xl font-extrabold sm:text-3xl">مدیر اجازهٔ نمایش این صفحه را نمی‌دهد</h1>
      <p className="mb-6 text-[var(--text-secondary)]">این صفحه فعلاً قفل است.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline hover:bg-[var(--brand-dark)]">
            درخواست از مدیر برای باز کردن قفل این صفحه
            <Send aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </a>
        )}
        <Link to="/" className="rounded-[var(--radius-sm)] border border-[var(--border-light)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] no-underline hover:bg-[var(--surface-alt)]">بازگشت به {siteConfig.siteName}</Link>
      </div>
    </main>
  )
}
