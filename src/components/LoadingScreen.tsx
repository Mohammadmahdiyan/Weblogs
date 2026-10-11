import { clsx } from 'clsx'

interface LoadingScreenProps {
  className?: string
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div
      aria-label="در حال بارگذاری…"
      aria-busy="true"
      role="status"
      className={clsx(
        'flex min-h-screen w-full items-center justify-center',
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div
            className="border-brand size-16 animate-spin rounded-full border-4 border-[var(--border-light)] border-t-[var(--brand)] motion-reduce:animate-none"
            aria-hidden="true"
          />
          <div className="absolute inset-0 m-auto size-8 rounded-full bg-[var(--brand)] opacity-20 blur-xl" />
        </div>
        <span className="text-sm text-[var(--text-secondary)]">در حال بارگذاری…</span>
      </div>
    </div>
  )
}

export function InlineLoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div
      aria-label="در حال بارگذاری"
      aria-busy="true"
      className="animate-pulse space-y-3"
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 w-full max-w-[95%] rounded-[var(--radius-sm)] bg-[var(--surface-strong)] last:w-[70%]"
        />
      ))}
    </div>
  )
}
