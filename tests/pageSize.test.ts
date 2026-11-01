import { describe, expect, it } from 'vitest'
import { pageSizeFor } from '../src/lib/pageSize.ts'

describe('pageSizeFor', () => {
  it('is always two rows: 6 wide (3 columns), 4 medium (2 columns), 2 on a phone (1 column)', () => {
    expect(pageSizeFor(true, true)).toBe(6)
    expect(pageSizeFor(false, true)).toBe(4)
    expect(pageSizeFor(false, false)).toBe(2)
    expect(6 / 3).toBe(2)
    expect(4 / 2).toBe(2)
    expect(2 / 1).toBe(2)
  })
})
