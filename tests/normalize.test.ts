import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from '../src/lib/normalize.ts'

describe('normalizeSearchText', () => {
  it('unifies Arabic and Persian letter variants', () => {
    expect(normalizeSearchText('كتاب')).toBe(normalizeSearchText('کتاب'))
    expect(normalizeSearchText('علي')).toBe(normalizeSearchText('علی'))
  })

  it('converts Persian and Arabic-Indic digits to ASCII', () => {
    expect(normalizeSearchText('۶ ساله')).toBe(normalizeSearchText('6 ساله'))
    expect(normalizeSearchText('٦')).toBe('6')
  })

  it('removes ZWNJ, diacritics and extra whitespace, and lowercases Latin', () => {
    expect(normalizeSearchText('  می‌شود   ')).toBe(normalizeSearchText('میشود'))
    expect(normalizeSearchText('ABC  def')).toBe('abc def')
  })
})
