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

  it('marks ancestor rails only while their ancestors have later siblings', () => {
    const branches = buildTocBranches(items)

    expect(branches.rails).toEqual([[], [true], [], [true], [true], [], [false]])
  })

  it('does not continue the rail for a single child and its single parent', () => {
    const branches = buildTocBranches([
      { level: 2, title: 'Only parent', id: 'only-parent' },
      { level: 3, title: 'Only child', id: 'only-child' },
    ])

    expect(branches.types).toEqual(['single', 'nested-single'])
    expect(branches.ancestorTypes).toEqual([[], ['nested-single']])
    expect(branches.rails).toEqual([[], [false]])
  })

  it('tracks rails through skipped heading levels and a level-three first heading', () => {
    const branches = buildTocBranches([
      { level: 3, title: 'First heading', id: 'first-heading' },
      { level: 4, title: 'Skipped child', id: 'skipped-child' },
      { level: 3, title: 'Last heading', id: 'last-heading' },
      { level: 4, title: 'Last child', id: 'last-child' },
    ])

    expect(branches.types).toEqual(['first', 'nested-single', 'last', 'nested-single'])
    expect(branches.rails).toEqual([[], [true], [], [false]])
  })

  it('computes one rail entry for every ancestor level', () => {
    const branches = buildTocBranches([
      { level: 2, title: 'a', id: 'a' },
      { level: 2, title: 'b', id: 'b' },
      { level: 3, title: 'b1', id: 'b1' },
      { level: 3, title: 'b2', id: 'b2' },
      { level: 4, title: 'b2a', id: 'b2a' },
      { level: 3, title: 'b3', id: 'b3' },
      { level: 2, title: 'c', id: 'c' },
      { level: 2, title: 'd', id: 'd' },
      { level: 3, title: 'd1', id: 'd1' },
    ])

    expect(branches.rails).toEqual([
      [],
      [],
      [true],
      [true],
      [true, true],
      [true],
      [],
      [],
      [false],
    ])
  })
})
