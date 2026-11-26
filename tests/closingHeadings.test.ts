import { describe, expect, it } from 'vitest'
import { findClosingHeadings, type HeadingSignature } from '../src/lib/closingHeadings.ts'
import { buildToc } from '../src/lib/toc.ts'

const h = (depth: number, text: string): HeadingSignature => ({ depth, text })
const closing = (headings: HeadingSignature[]) => [...findClosingHeadings(headings)]

describe('findClosingHeadings', () => {
  it('takes a repeated identical ### as the end marker of the one before it', () => {
    expect(closing([h(2, 'A'), h(3, 'Test'), h(3, 'Test'), h(3, 'Other')])).toEqual([2])
  })

  it('allows deeper headings between the two', () => {
    expect(closing([h(3, 'Test'), h(4, 'Inner'), h(3, 'Test')])).toEqual([2])
  })

  it('works for #### and deeper', () => {
    expect(closing([h(4, 'Test'), h(4, 'Test')])).toEqual([1])
  })

  it('ignores the same title under different parents', () => {
    expect(closing([h(2, 'A'), h(3, 'Example'), h(2, 'B'), h(3, 'Example')])).toEqual([])
    expect(closing([h(4, 'Example'), h(3, 'Other'), h(4, 'Example')])).toEqual([])
  })

  it('leaves ## alone', () => {
    expect(closing([h(2, 'Test'), h(2, 'Test')])).toEqual([])
  })

  it('compares after normalizing (ي/ی, ك/ک, extra spaces)', () => {
    expect(closing([h(3, 'يك  مثال'), h(3, 'یک مثال')])).toEqual([1])
  })

  it('does not let a marker close the same heading twice', () => {
    expect(closing([h(3, 'T'), h(3, 'T'), h(3, 'T')])).toEqual([1])
  })
})

describe('buildToc with closing headings', () => {
  it('leaves the marker out and does not use up its slug', () => {
    const toc = buildToc('## A\n\n### T\n\ntext\n\n### T\n\nmore\n\n## B\n\n### T\n')
    expect(toc.map((item) => item.id)).toEqual(['a', 't', 'b', 't-1'])
  })
})
