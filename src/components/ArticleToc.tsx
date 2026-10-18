import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import type { SVGProps } from 'react'
import type { TocItem } from '../lib/toc'
import { useMediaQuery } from '../lib/useMediaQuery'

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
    single: 'M2 12 H22',
    first: 'M16 24 V12 H2',
    middle: 'M16 0 V24 M16 12 H2',
    last: 'M8 0 V12 H2',
    continuation: 'M8 0 V24',

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

function getBranchType(
  items: TocItem[],
  index: number,
): TocBranchType {
  if (items.length === 1) return 'single'
  if (index === 0) return 'first'
  if (index === items.length - 1) return 'last'

  const current = items[index]
  const next = items[index + 1]

  if (current && next && next.level > current.level) {
    return 'middle'
  }

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
                className="shrink-0"
              />
            )}

            <TocBranch
              type={branchType}
              className="shrink-0"
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
              {item.title}
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