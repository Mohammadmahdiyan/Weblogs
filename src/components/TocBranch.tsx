import type { SVGProps } from 'react'

export type TocBranchType =
  | 'single'
  | 'first'
  | 'middle'
  | 'last'
  | 'continuation'

interface TocBranchProps extends SVGProps<SVGSVGElement> {
  type: TocBranchType
}

export default function TocBranch({
  type,
  className,
  ...props
}: TocBranchProps) {
  const common: SVGProps<SVGPathElement> = {
    fill: 'none',
    stroke: 'var(--brand)',
    strokeWidth: 2,
    strokeLinecap: 'square',
    strokeLinejoin: 'round',
  }

  const paths: Record<TocBranchType, string> = {
    single: 'M2 12 H22',
    first: 'M0 2 H22 M8 2 V24',
    middle: 'M8 0 V24 M8 12 H22',
    last: 'M22 0 V12 H0',
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
      <path {...common} d={paths[type]} />
    </svg>
  )
}