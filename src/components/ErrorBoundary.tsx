import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  fallback?: ReactNode
  children?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return <>{this.props.fallback}</>

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p aria-label="خطا" className="mb-4 text-sm font-semibold text-[var(--danger)]">
          ⚠️ {this.state.error?.message || 'خطا در بارگذاری صفحه'}
        </p>
        <h1 className="mb-3 text-2xl font-bold text-[var(--text)]">مشکلی پیش آمد</h1>
        <p className="mb-6 text-[var(--text-secondary)]">
          متاسفانه نمی‌توانیم این صفحه را نمایش دهیم. لطفاً دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] no-underline hover:bg-[var(--brand-dark)] focus-visible:outline-2 focus-visible:outline-[var(--info)] focus-visible:outline-offset-2"
        >
          بازنشانی صفحه
        </button>
      </main>
    )
  }
}
