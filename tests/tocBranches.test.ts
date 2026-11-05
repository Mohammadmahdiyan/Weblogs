import { describe, expect, it } from 'vitest'
import { buildTocBranches } from '../src/lib/tocBranches.ts'
import type { TocItem } from '../src/lib/toc.ts'

const items: TocItem[] = [
  { level: 2, title: 'First', id: 'first' },
  { level: 3, title: 'First child', id: 'first-child' },
  { level: 2, title: 'Middle', id: 'middle' },
  { level: 3, title: 'First middle child', id: 'middle-child-first' },
  { level: 3, title: 'Last middle child', id: 'middle-child-last' },
  { level: 2, title: 'Last', id: 'last' },
  { level: 3, title: 'Last child', id: 'last-child' },
]

describe('buildTocBranches', () => {
  it('classifies top-level items and their nested items independently', () => {
    const branches = buildTocBranches(items)

    expect(branches.types).toEqual(['first', 'single', 'middle', 'first', 'last', 'last', 'single'])
  })

  it('preserves the first, middle, and last parent branch for nested items', () => {
    const branches = buildTocBranches(items)

    expect(branches.ancestorTypes).toEqual([[], ['first'], [], ['middle'], ['middle'], [], ['last']])
  })
})
