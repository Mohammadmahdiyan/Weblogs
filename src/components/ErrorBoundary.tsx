import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State { failed: boolean }

/** Last-resort boundary: keeps the whole app from turning into a white page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main role="alert" className="mx-auto grid min-h-screen max-w-md content-center gap-4 px-6 text-center text-[var(--text)]">
        <h1 className="m-0 text-2xl font-extrabold">مشکلی پیش آمد</h1>
        <p className="m-0 text-[var(--text-secondary)]">صفحه به‌درستی بارگذاری نشد. لطفاً دوباره تلاش کنید.</p>
        <button type="button" onClick={() => window.location.reload()} className="mx-auto rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-contrast)]">
          بارگذاری دوباره
        </button>
      </main>
    )
  }
}
