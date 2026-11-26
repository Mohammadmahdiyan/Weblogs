import { describe, expect, it } from 'vitest'
import { ELLIPSIS, LABEL_MAX_LENGTH, isLongSelection, linkLabel, markdownLink, telegramLinkPayload, textLinkUrl } from '../src/lib/textLink.ts'

const article = 'https://example.github.io/Weblogs/media/a/b'

describe('linkLabel', () => {
  const long = 'این یک متن بسیار طولانی است که خواننده انتخاب کرده و باید کوتاه شود، سپس ادامه دارد'

  it('keeps a short selection as it is (whitespace squashed)', () => {
    expect(linkLabel('  یک   متن\nکوتاه ', false)).toBe('یک متن کوتاه')
    expect(isLongSelection('یک متن کوتاه')).toBe(false)
  })

  it('shortens a long selection with three dots', () => {
    const label = linkLabel(long, false)
    expect(isLongSelection(long)).toBe(true)
    expect(label.endsWith(ELLIPSIS)).toBe(true)
    expect(label.length).toBeLessThanOrEqual(LABEL_MAX_LENGTH + ELLIPSIS.length)
  })

  it('keeps the whole text when asked, without three dots', () => {
    expect(linkLabel(long, true)).toBe(long)
  })
})

describe('textLinkUrl', () => {
  it('opens the article at the text: ?find=, with &e= for a long passage and &n= from the second occurrence', () => {
    expect(textLinkUrl(article, { find: 'سلام', occurrence: 0 })).toBe(`${article}?find=${encodeURIComponent('سلام')}`)
    const url = textLinkUrl(`${article}?find=old#heading`, { find: 'آغاز', end: 'پایان', occurrence: 2 })
    expect(url).toBe(`${article}?find=${encodeURIComponent('آغاز')}&e=${encodeURIComponent('پایان')}&n=3`)
  })

  it('escapes parentheses so a Markdown link cannot end early', () => {
    expect(textLinkUrl(article, { find: 'a (b)', occurrence: 0 })).not.toMatch(/[()]/)
  })
})

describe('copy formats', () => {
  it('Telegram: a link in the HTML half, the text and the address in the plain half', () => {
    const payload = telegramLinkPayload('x<y', `${article}?find=a&n=2`)
    expect(payload.html).toBe(`<a href="${article}?find=a&amp;n=2">x&lt;y</a>`)
    expect(payload.text).toBe(`x<y\n${article}?find=a&n=2`)
  })

  it('code: [text](link), with brackets in the text escaped', () => {
    expect(markdownLink('a [b] c', `${article}?find=a`)).toBe(`[a \\[b\\] c](${article}?find=a)`)
  })
})
