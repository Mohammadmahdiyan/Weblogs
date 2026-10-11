import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from './normalize'

describe('normalizeSearchText', () => {
  it('converts Persian digits to ASCII', () => {
    expect(normalizeSearchText('۱۲۳۴۵')).toBe('12345')
    expect(normalizeSearchText('۱۲۳۴۵')).toBe('12345')
  })

  it('converts Arabic-Indic digits to ASCII', () => {
    expect(normalizeSearchText('١٢٣٤٥')).toBe('12345')
  })

  it('normalizes ی and ى to ی', () => {
    expect(normalizeSearchText('ییی')).toBe('ییی')
    expect(normalizeSearchText('ىىى')).toBe('ییی')
  })

  it('normalizes ك to ک', () => {
    expect(normalizeSearchText('ككك')).toBe('ککک')
  })

  it('removes diacritics (tashkeel)', () => {
    expect(normalizeSearchText('سَلامُ')).toBe('سلام')
  })

  it('removes ZWNJ and zero-width characters', () => {
    expect(normalizeSearchText('سلام\u200cعلیک')).toBe('سلامعلیک')
  })

  it('lowercases Latin text', () => {
    expect(normalizeSearchText('Hello WORLD')).toBe('hello world')
  })

  it('trims and collapses whitespace', () => {
    expect(normalizeSearchText('  hello   world  ')).toBe('hello world')
  })

  it('handles mixed Persian and Latin text', () => {
    expect(normalizeSearchText('سلام hello 123')).toBe('سلام hello 123')
  })
})
