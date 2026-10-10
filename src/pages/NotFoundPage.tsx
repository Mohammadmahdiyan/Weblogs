import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/usePageMeta'
import siteConfig from '../site.config'

export function NotFoundPage() {
  usePageMeta({ title: 'صفحه پیدا نشد', description: 'صفحه‌ی درخواستی پیدا نشد.' })
  return (
    <main className="mx-auto grid min-h-[55vh] max-w-3xl content-center justify-items-center px-4 py-16 text-center">
      <p className="mb-2 text-sm font-semibold text-[var(--brand)]">۴۰۴</p>
      <h1 className="mb-3 text-3xl font-extrabold">این صفحه پیدا نشد</h1>
      <p className="mb-6 text-[var(--text-secondary)]">ممکن است نشانی تغییر کرده یا نوشته برداشته شده باشد.</p>
      <Link to="/" className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline hover:bg-[var(--brand-dark)]">بازگشت به {siteConfig.siteName}</Link>
    </main>
  )
}