/** Theme-aware route loader. Pure CSS animation; respects prefers-reduced-motion (see index.css). */
export function LoadingScreen() {
  return (
    <main role="status" aria-busy="true" className="grid min-h-[55vh] place-items-center px-4 py-12 text-[var(--text)]">
      <div className="grid justify-items-center gap-4">
        <div className="relative size-14">
          <div className="loader-ring" />
          <span aria-hidden="true" className="loader-dot" />
        </div>
        <span className="text-sm text-[var(--text-secondary)]">در حال بارگذاری…</span>
      </div>
    </main>
  )
}
