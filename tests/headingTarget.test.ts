import { describe, expect, it } from 'vitest'
import { resolveHeadingTarget } from '../src/lib/headingTarget.ts'

const headings = [
  { id: 'dlyl-pskh', text: 'دلیل پاسخ' },
  { id: 'nqsh-1', text: 'نقش پیامبر ص' },
  { id: 'nqsh-2', text: 'نقش پیامبر در پاسخ' },
  { id: 'custom-id', text: 'عنوان سفارشی' },
]

describe('resolveHeadingTarget', () => {
  it('prefers an exact id before heading text matches', () => {
    expect(resolveHeadingTarget('custom-id', [{ id: 'custom-id', text: 'عنوان دیگر' }, ...headings])).toBe('custom-id')
  })

  it('matches exact visible text despite punctuation and diacritics', () => {
    expect(resolveHeadingTarget('دلیلُ، پاسخ!', headings)).toBe('dlyl-pskh')
  })

  it('uses a unique partial text match', () => {
    expect(resolveHeadingTarget('پیامبر در پاسخ', headings)).toBe('nqsh-2')
  })

  it('does not choose between ambiguous partial matches or empty fragments', () => {
    expect(resolveHeadingTarget('نقش', headings)).toBeNull()
    expect(resolveHeadingTarget('!!!', headings)).toBeNull()
  })
})
