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

    expect(branches.types).toEqual(['first', 'nested-single', 'middle', 'first', 'last', 'last', 'nested-single'])
  })

  it('preserves the first, middle, and last parent branch for nested items', () => {
    const branches = buildTocBranches(items)

    expect(branches.ancestorTypes).toEqual([[], ['first'], [], ['middle'], ['middle'], [], ['last']])
  })

  it('keeps a vertical branch for a single child and its single parent', () => {
    const branches = buildTocBranches([
      { level: 2, title: 'Only parent', id: 'only-parent' },
      { level: 3, title: 'Only child', id: 'only-child' },
    ])

    expect(branches.types).toEqual(['single', 'nested-single'])
    expect(branches.ancestorTypes).toEqual([[], ['nested-single']])
  })
})
