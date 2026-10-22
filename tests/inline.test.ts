import { describe, expect, it } from 'vitest'
import { inlineToPlainText, parseMiniOptions, splitInline } from '../src/lib/inline.ts'

const isEmoji = (name: string) => ['خخخ', 'قلب'].includes(name)

describe('parseMiniOptions', () => {
  it('defaults to medium size, top placement', () => {
    expect(parseMiniOptions(undefined)).toEqual({ size: 'medium', placement: 'top' })
  })

  it('reads size and placement in any order, with either comma', () => {
    expect(parseMiniOptions('سایز: کوچک،قرارگیری: وسط')).toEqual({ size: 'small', placement: 'middle' })
    expect(parseMiniOptions('قرار‌گیری : پایین , سایز : بزرگ')).toEqual({ size: 'large', placement: 'bottom' })
  })

  it('keeps the default for unknown words', () => {
    expect(parseMiniOptions('سایز: عجیب')).toEqual({ size: 'medium', placement: 'top' })
  })
})

describe('splitInline', () => {
  it('finds mini text with its options', () => {
    expect(splitInline('سلام ((سلام دنیا))(سایز: متوسط،قرارگیری: بالا) خداحافظ', isEmoji)).toEqual([
      { type: 'text', value: 'سلام ' },
      { type: 'mini', text: 'سلام دنیا', size: 'medium', placement: 'top' },
      { type: 'text', value: ' خداحافظ' },
    ])
  })

  it('does not swallow an ordinary parenthesis that follows mini text', () => {
    expect(splitInline('((۱۲))(ص) بعد', isEmoji)).toEqual([
      { type: 'mini', text: '۱۲', size: 'medium', placement: 'top' },
      { type: 'text', value: '(ص) بعد' },
    ])
  })

  it('replaces only registered emoji', () => {
    expect(splitInline('اینجا {خخخ} و {ناشناس}', isEmoji)).toEqual([
      { type: 'text', value: 'اینجا ' },
      { type: 'emoji', name: 'خخخ' },
      { type: 'text', value: ' و {ناشناس}' },
    ])
  })
})

describe('inlineToPlainText', () => {
  it('keeps mini-text words and drops emoji', () => {
    expect(inlineToPlainText('الف {خخخ} ((ب))(سایز: کوچک) ج', isEmoji)).toBe('الف  ب ج')
  })
})
