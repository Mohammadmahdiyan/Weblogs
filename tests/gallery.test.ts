import { describe, expect, it } from 'vitest'
import { galleryRows } from '../src/lib/gallery.ts'

describe('galleryRows at 100% font size', () => {
  it('follows the requested layouts', () => {
    expect(galleryRows(1)).toEqual([1])
    expect(galleryRows(2)).toEqual([2])
    expect(galleryRows(3)).toEqual([2, 1])
    expect(galleryRows(4)).toEqual([2, 2])
    expect(galleryRows(5)).toEqual([3, 2])
    expect(galleryRows(6)).toEqual([3, 3])
  })

  it('continues the same way beyond six', () => {
    expect(galleryRows(7)).toEqual([3, 2, 2])
    expect(galleryRows(8)).toEqual([3, 3, 2])
    expect(galleryRows(9)).toEqual([3, 3, 3])
    expect(galleryRows(10)).toEqual([3, 3, 2, 2])
  })

  it('always accounts for every item', () => {
    for (let count = 1; count <= 40; count += 1) {
      for (const percent of [80, 100, 125, 150]) {
        expect(galleryRows(count, percent).reduce((sum, row) => sum + row, 0)).toBe(count)
      }
    }
  })
})

describe('galleryRows follows the font size', () => {
  it('bigger text → fewer items per row', () => {
    expect(galleryRows(6, 150)).toEqual([2, 2, 2])
    expect(galleryRows(4, 150)).toEqual([1, 1, 1, 1])
    expect(galleryRows(5, 125)).toEqual([2, 2, 1])
  })

  it('smaller text → more items per row', () => {
    expect(galleryRows(8, 80)).toEqual([4, 4])
    expect(galleryRows(3, 80)).toEqual([3])
    expect(galleryRows(2, 80)).toEqual([2])
  })

  it('never exceeds what physically fits', () => {
    expect(galleryRows(6, 100, 2)).toEqual([2, 2, 2])
    expect(galleryRows(4, 100, 1)).toEqual([1, 1, 1, 1])
  })
})
