import { describe, expect, it } from 'vitest'
import { normalizeSearchText, normalizeWithMap } from '../src/lib/normalize.ts'

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

describe('searching a vowelled / Quranic text without marks', () => {
  const simple = 'إِنَّ اللَّهَ لَا يَسْتَحْيِي أَنْ يَضْرِبَ مَثَلًا مَا بَعُوضَةً فَمَا فَوْقَهَا ۚ'
  const uthmani = 'إِنَّ ٱللَّهَ لَا يَسۡتَحۡىِۦٓ أَن يَضۡرِبَ مَثَلٗا مَّا بَعُوضَةٗ فَمَا فَوۡقَهَاۚ'

  it.each([simple, uthmani])('finds the phrase typed plainly', (text) => {
    const haystack = normalizeSearchText(text)
    for (const query of ['يضرب مثلا ما', 'ان الله', 'أن يضرب', 'بعوضه فما فوقها', 'لا يستح']) {
      expect(haystack).toContain(normalizeSearchText(query))
    }
  })

  it('folds alef and hamza forms and ta marbuta', () => {
    expect(normalizeSearchText('أئمة')).toBe(normalizeSearchText('ائمه'))
    expect(normalizeSearchText('مسؤول')).toBe(normalizeSearchText('مسوول'))
    expect(normalizeSearchText('ﷲ')).toBe('الله')
  })
})

describe('normalizeWithMap', () => {
  it('gives the same text as normalizeSearchText', () => {
    const sample = '  علي   می‌گوید ۶ ساله\u064e  '
    expect(normalizeWithMap(sample).text).toBe(normalizeSearchText(sample))
  })

  it('maps every normalized character back to the original text', () => {
    const original = 'کتاب  می‌شود'
    const { text, map } = normalizeWithMap(original)
    expect(map).toHaveLength(text.length)
    const index = text.indexOf('میشود')
    expect(original.slice(map[index], map[index + 4] + 1)).toBe('می‌شود')
  })
})
