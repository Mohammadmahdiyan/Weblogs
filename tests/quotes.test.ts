import { describe, expect, it } from 'vitest'
import { ITEMS_MARKER, normalizeQuotes } from '../src/lib/quotes.ts'

const lines = (...rows: string[]) => rows.join('\n')

describe('normalizeQuotes', () => {
  it('leaves a simple one-line quote alone', () => {
    expect(normalizeQuotes('> سلام')).toBe('> سلام')
  })

  it('turns >> … << into one quote that keeps its Enters and blank lines', () => {
    const typed = lines('>> این یک نقل قول ', 'طولانی هست', 'که شامل اینتر میشه ', 'خیلی طولانی<<', '', 'متن بعدی')
    expect(normalizeQuotes(typed)).toBe(lines('> این یک نقل قول  ', '> طولانی هست  ', '> که شامل اینتر میشه  ', '> خیلی طولانی', '', 'متن بعدی'))
    expect(normalizeQuotes(lines('>> الف', '', 'ب<<'))).toBe(lines('> الف', '>', '> ب'))
    expect(normalizeQuotes('>> یک خط <<')).toBe('> یک خط')
  })

  it('leaves >> without a closing << as written', () => {
    const typed = lines('>> بدون پایان', 'خط دوم')
    expect(normalizeQuotes(typed)).toBe(typed)
  })

  it('does not run past a directive fence looking for <<', () => {
    const typed = lines(':::item{title="a"}', '>> بدون پایان', ':::', ':::item{title="b"}', 'متن<<', ':::')
    expect(normalizeQuotes(typed)).toBe(typed)
  })

  it('puts consecutive > lines into one box as separate quotes', () => {
    expect(normalizeQuotes(lines('> اول', '> دوم'))).toBe(lines(`> ${ITEMS_MARKER}`, '>', '> اول', '>', '> دوم'))
  })

  it('joins a line without > to the quote above it; a blank line ends the quote', () => {
    const typed = lines('> سلام خوبی', 'چخبر', '', 'و سلام درود')
    expect(normalizeQuotes(typed)).toBe(typed)
    expect(normalizeQuotes(lines('> الف', 'ادامه الف', '> ب'))).toBe(lines(`> ${ITEMS_MARKER}`, '>', '> الف', 'ادامه الف', '>', '> ب'))
  })

  it('keeps quotes with lists, code, nested quotes and blank quote lines as they are', () => {
    for (const typed of [lines('> - الف', '> - ب'), lines('> ```', '> x', '> ```'), lines('> الف', '> > تو در تو'), lines('> الف', '>', '> ب')]) {
      expect(normalizeQuotes(typed)).toBe(typed)
    }
  })

  it('ignores code fences and keeps Windows line endings', () => {
    const code = lines('```', '>> x', 'y<<', '```')
    expect(normalizeQuotes(code)).toBe(code)
    expect(normalizeQuotes('> الف\r\n> ب')).toBe([`> ${ITEMS_MARKER}`, '>', '> الف', '>', '> ب'].join('\r\n'))
  })
})
