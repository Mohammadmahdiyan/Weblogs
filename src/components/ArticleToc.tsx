import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import type { SVGProps } from 'react'
import type { TocItem } from '../lib/toc'
import { useMediaQuery } from '../lib/useMediaQuery'


const tocHonorificFiles: Record<string, string> = {
  'ص': 'sas.svg', 'ﷺ': 'sas.svg', 'صا': 'saa.svg',
  'ع': 'as.svg', 'رض': 'radu.svg', 'رح': 'rahimahu.svg',
  'رضها': 'rada.svg', 'رضهما': 'raduma.svg', 'رضهم': 'radum.svg', 'رضهن': 'radunna.svg',
  'رحها': 'rahimaha.svg', 'رحهما': 'rahimahuma.svg', 'رحهم': 'rahimahum.svg', 'رحهن': 'rahimahunna.svg',
  'جل': 'jal.svg', 'عز': 'awj.svg', 'سبح': 'swt.svg', 'تبارك': 'twt.svg', 'حف': 'haf.svg',
}

function TocTitle({ title }: { title: string }) {
  const parts = title.split(/\(\s*(صلى الله عليه وسلم|ﷺ|صلى الله عليه و آله|صا|ص|عليه الصلاة والسلام|عليه السلام|عليها السلام|عليهم السلام|ع|رضي الله عنهما|رضي الله عنهم|رضي الله عنهن|رضي الله عنها|رضي الله عنه|رضهما|رضهم|رضهن|رضها|رض|رحمهما الله|رحمهم الله|رحمهن الله|رحمها الله|رحمه الله|رحهما|رحهم|رحهن|رحها|رح|جل جلاله|عز وجل|جل وعلا|سبحانه وتعالى|تبارك وتعالى|جل|عز|سبح|تبارك|حفظه الله|حف)\s*\)/g)
  return <>{parts.map((part, index) => {
    const key = part.trim()
    const file = tocHonorificFiles[key]
    if (!file) return <span key={index}>{part}</span>
    return <img key={index} src={`${import.meta.env.BASE_URL}honorifics/${file}`} alt={key} title={key} className="mx-0.5 inline-block h-[1.35em] w-[1.35em] object-contain align-[-0.3em]" />
  })}</>
}

type TocBranchType =
  | 'single'
  | 'first'
  | 'middle'
  | 'last'
  | 'continuation'

interface TocBranchProps extends SVGProps<SVGSVGElement> {
  type: TocBranchType
}

function TocBranch({
  type,
  className,
  ...props
}: TocBranchProps) {
  const pathProps: SVGProps<SVGPathElement> = {
    fill: 'none',
    stroke: '#16a34a',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const paths: Record<TocBranchType, string> = {
    single: 'M16 12 H2',
    first: 'M16 24 V12 H2',
    middle: 'M16 0 V24 M16 12 H2',
    continuation: 'M16 0 V24',
    last: 'M16 0 V12 H2',
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path {...pathProps} d={paths[type]} />
    </svg>
  )
}

function getParentIndex(items: TocItem[], index: number): number {
  const current = items[index]
  if (!current) return -1

  for (let i = index - 1; i >= 0; i--) {
    const previous = items[i]

    if (previous && previous.level < current.level) {
      return i
    }
  }

  return -1
}

function getBranchType(
  items: TocItem[],
  index: number,
): TocBranchType {
  const current = items[index]
  if (!current) return 'single'

  const parentIndex = getParentIndex(items, index)

  const siblings = items
    .map((item, itemIndex) => ({
      item,
      index: itemIndex,
      parentIndex: getParentIndex(items, itemIndex),
    }))
    .filter(
      ({ item, parentIndex: itemParentIndex }) =>
        item.level === current.level &&
        itemParentIndex === parentIndex,
    )

  const position = siblings.findIndex(
    (sibling) => sibling.index === index,
  )

  if (siblings.length <= 1) return 'single'
  if (position === 0) return 'first'
  if (position === siblings.length - 1) return 'last'

  return 'middle'
}
function useActiveHeading(
  items: TocItem[],
  enabled: boolean,
): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || items.length === 0) return

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        }

        const first = elements.find((element) =>
          visible.has(element.id),
        )

        if (first) setActive(first.id)
      },
      { rootMargin: '-80px 0px -65% 0px' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [enabled, items])

  return active
}

export function ArticleToc({
  items,
  variant,
}: {
  items: TocItem[]
  variant: 'box' | 'side'
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const active = useActiveHeading(items, variant === 'side')

  if (items.length === 0) return null

  const list = (
    <ul className="m-0 grid list-none gap-2 p-0">
      {items.map((item, index) => {
        const branchType = getBranchType(items, index)
        const isChild = item.level > 2

        return (
          <li
            key={item.id}
            className="flex min-w-0 items-stretch gap-2"
          >
            {isChild && (
              <TocBranch
                type="continuation"
                className="-ms-1 shrink-0"
              />
            )}

            <TocBranch
              type={branchType}
              className="-ms-1 shrink-0"
            />

            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              className={clsx(
                'min-w-0 flex-1 py-1 text-start text-sm no-underline transition-colors hover:text-[var(--brand)]',
                active === item.id
                  ? 'font-bold text-[var(--brand)]'
                  : 'text-[var(--text-secondary)]',
              )}
            >
              <TocTitle title={item.title} />
            </a>
          </li>
        )
      })}
    </ul>
  )

  if (variant === 'side') {
    return (
      <details
        open={isDesktop}
        className="article-toc rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] lg:border-0 lg:bg-transparent"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-start text-sm font-bold lg:cursor-default lg:px-0">
          <BookOpen
            aria-hidden="true"
            className="size-4 text-[var(--brand)]"
          />
          در این صفحه
        </summary>

        <nav
          aria-label="فهرست مطالب"
          className="px-4 pb-4 lg:px-0"
        >
          {list}
        </nav>
      </details>
    )
  }

  return (
    <details
      open
      className="article-toc my-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 bg-[var(--surface-alt)] px-4 py-3 text-start text-sm font-bold text-[var(--text)]">
        <BookOpen
          aria-hidden="true"
          className="size-4 text-[var(--brand)]"
        />
        نگاه کلی به مطالب
      </summary>

      <nav
        aria-label="فهرست مطالب"
        className="px-4 py-3"
      >
        {list}
      </nav>
    </details>
  )
}