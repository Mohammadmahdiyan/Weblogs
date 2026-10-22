/**
 * Opening invocation shown at the top of every article (written once here, never in the .md files).
 * Each Arabic line is centred, with its Persian translation right below it in a slightly smaller size.
 */
const lines = [
  {
    arabic: 'بسم الله الرحمن الرحيم',
    translation: 'به نام خداوند بخشنده مهربان',
  },
  {
    arabic: 'وصلى الله تعالى على خير خلقه محمدٍ وآله وصحبه أجمعين',
    translation: 'و درود خداوند متعال بر بهترین آفریده‌اش، محمد، و بر خاندان و همهٔ یارانش',
  },
]

export function Basmala() {
  return (
    <section aria-label="بسم الله" dir="rtl" className="article-basmala my-6 grid gap-4 text-center">
      {lines.map(({ arabic, translation }) => (
        <div key={arabic} className="grid gap-1">
          <p lang="ar" className="m-0 text-xl font-bold leading-10 text-[var(--text)]">{arabic}</p>
          <p lang="fa" className="m-0 text-sm leading-7 text-[var(--text-secondary)]">{translation}</p>
        </div>
      ))}
    </section>
  )
}
