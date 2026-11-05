import { describe, expect, it } from 'vitest'
import { prepareSource, telegramFromMarkdown, telegramPart } from '../src/lib/telegram.ts'

const offsetOf = (markdown: string, snippet: string) => prepareSource(markdown).indexOf(snippet)

describe('telegramFromMarkdown', () => {
  it('turns formatting into Telegram markup and into HTML', () => {
    const { text, html } = telegramFromMarkdown('متن **بولد** و *کج* و ~~خط‌خورده~~ و `mono` و ||راز|| و <u>زیرخط</u>')
    expect(text).toBe('متن **بولد** و __کج__ و ~~خط‌خورده~~ و `mono` و ||راز|| و زیرخط')
    expect(html).toBe('متن <b>بولد</b> و <i>کج</i> و <s>خط‌خورده</s> و <code>mono</code> و <tg-spoiler>راز</tg-spoiler> و <u>زیرخط</u>')
  })

  it('keeps quotes as quotes and links as links', () => {
    const { text, html } = telegramFromMarkdown('> نقل\n\n[سایت](https://example.com) و [مقاله](/blog/a)')
    expect(text).toContain('> نقل')
    expect(text).toContain('سایت (https://example.com)')
    expect(html).toContain('<blockquote>نقل</blockquote>')
    expect(html).toContain('<a href="https://example.com">سایت</a>')
    expect(html).toMatch(/<a href="https?:\/\/[^"]+\/blog\/a">مقاله<\/a>/)
  })

  it('makes headings bold, lists with bullets, writes an image as «عکس» and drops relative links', () => {
    const { text } = telegramFromMarkdown('## عنوان\n\n- الف\n- ب\n\n![تصویر](./a.jpg) [محلی](#x)')
    expect(text).toBe('**عنوان**\n\n• الف\n• ب\n\nعکس محلی')
  })

  it('puts a quote with blank lines (>> … <<) in ONE quote', () => {
    expect(telegramFromMarkdown('>> الف\n\nب<<').text).toBe('> الف\n>\n> ب')
  })

  it('writes accordion titles and chat messages', () => {
    const { text } = telegramFromMarkdown(':::accordion\n:::item{title="عنوان"}\nسوال1 : (این چیست؟)\nجواب1 : (پاسخ)\n:::\n:::')
    expect(text).toBe('**عنوان**\n\n**سوال ۱:** این چیست؟\n\n**جواب ۱:** پاسخ')
  })
})

describe('plainQuote for phones', () => {
  it('wraps a quote in « … » instead of starting each line with >, and keeps the HTML quote', () => {
    const { text, html } = telegramFromMarkdown('پیش\n\n> نقل **مهم**\n\nپس', { plainQuote: 'guillemets' })
    expect(text).toBe('پیش\n\n«نقل **مهم**»\n\nپس')
    expect(html).toContain('<blockquote>نقل <b>مهم</b></blockquote>')
  })

  it('keeps several paragraphs of one quote inside one pair of « »', () => {
    expect(telegramFromMarkdown('>> الف\n\nب<<', { plainQuote: 'guillemets' }).text).toBe('«الف\n\nب»')
  })

  it('does not change the default', () => {
    expect(telegramFromMarkdown('> نقل').text).toBe('> نقل')
  })
})

describe('telegramPart', () => {
  const markdown = '## یک\n\nمتن یک\n\n### زیر\n\nمتن زیر\n\n## دو\n\nمتن دو\n\n> نقل'

  it('copies a heading together with everything up to the next heading of the same level', () => {
    const part = telegramPart(markdown, offsetOf(markdown, '## یک'))
    expect(part?.kind).toBe('section')
    expect(part?.payload.text).toBe('**یک**\n\nمتن یک\n\n**زیر**\n\nمتن زیر')
  })

  it('copies a quote by itself, and nothing for an unknown offset', () => {
    expect(telegramPart(markdown, offsetOf(markdown, '> نقل'))).toMatchObject({ kind: 'quote', payload: { text: '> نقل' } })
    expect(telegramPart(markdown, 9999)).toBeNull()
  })

  it('stops a ## section at the next ## but keeps its ### parts', () => {
    expect(telegramPart(markdown, offsetOf(markdown, '## دو'))?.payload.text).toBe('**دو**\n\nمتن دو\n\n> نقل')
    expect(telegramPart(markdown, offsetOf(markdown, '### زیر'))?.payload.text).toBe('**زیر**\n\nمتن زیر')
  })
})

describe('honorifics', () => {
  it('writes the phrase instead of the picture marker', () => {
    const { text } = telegramFromMarkdown('موسی (ع) و رسول الله (ص) و رسول الله (صلى الله عليه وسلم) و الله (جل) و ابوبکر (رض) و پیامبر (علیه السلام)')
    expect(text).toBe('موسی (علیه السلام) و رسول الله (ﷺ) و رسول الله (ﷺ) و الله (جل جلاله) و ابوبکر (رضی الله عنه) و پیامبر (علیه السلام)')
  })

  it('leaves other parentheses alone', () => {
    expect(telegramFromMarkdown('این (یک مثال) است').text).toBe('این (یک مثال) است')
  })
})

describe('enters and images', () => {
  it('keeps the Enters of the source', () => {
    expect(telegramFromMarkdown('خط اول\nخط دوم\n\nپاراگراف').text).toBe('خط اول\nخط دوم\n\nپاراگراف')
    expect(telegramFromMarkdown('خط اول\nخط دوم').html).toBe('خط اول<br>خط دوم')
    expect(telegramFromMarkdown('> نقل\nادامه').text).toBe('> نقل\n> ادامه')
  })

  it('writes a picture as «عکس» (never its file name or alt text); a video or sound keeps its file name', () => {
    expect(telegramFromMarkdown('![عکس پروژه](./17hazar-in-qadir-top-site.png)').text).toBe('عکس')
    expect(telegramFromMarkdown('![](./photos/my%20pic.png?v=2)').text).toBe('عکس')
    expect(telegramFromMarkdown('![](https://cdn.steadylink.io/a/0cf9f84a-67ab-4786-8f51-eb98a6a4b2f8)').text).toBe('عکس')
    expect(telegramFromMarkdown('![](./a.mp4)').text).toBe('a.mp4')
    expect(telegramFromMarkdown('::video{link="./clip.mp4", cover="./c.jpg"}').text).toBe('clip.mp4')
    expect(telegramFromMarkdown('::audio{link="https://example.com/x/music.mp3"}').text).toBe('music.mp3')
  })

  it('names several pictures «عکس اول»، «عکس دوم»، «عکس سوم»', () => {
    const three = '![](https://example.com/a)\n![](https://example.com/b)\n![](https://example.com/c)'
    expect(telegramFromMarkdown(three).text).toBe('عکس اول\nعکس دوم\nعکس سوم')
    expect(telegramFromMarkdown('متن\n\n![](a.png)\n\nمتن دو\n\n![](b.png)').text).toBe('متن\n\nعکس اول\n\nمتن دو\n\nعکس دوم')
    expect(telegramFromMarkdown('![](a.png)\n\n::video{link="v.mp4"}').text).toBe('عکس\n\nv.mp4')
    const many = Array.from({ length: 21 }, (_, index) => `![](https://example.com/${index})`).join('\n')
    expect(telegramFromMarkdown(many).text.split('\n').slice(-2)).toEqual(['عکس بیستم', `عکس ${(21).toLocaleString('fa-IR')}`])
  })

  it('links the pasted label to the picture when the picture has an address', () => {
    expect(telegramFromMarkdown('![](https://example.com/a)').html).toBe('<a href="https://example.com/a">عکس</a>')
    expect(telegramFromMarkdown('![](/Weblogs/content/x/a.png)').html).toMatch(/^<a href="https?:\/\/[^"/]+\/Weblogs\/content\/x\/a\.png">عکس<\/a>$/)
    expect(telegramFromMarkdown('![](./a.png)').html).toBe('عکس')
  })

  it('turns --- into a long line of dashes and `--- text ---` into a line with the text in the middle', () => {
    const line = '-'.repeat(42)
    expect(telegramFromMarkdown('الف\n\n---\n\nب').text).toBe(`الف\n\n${line}\n\nب`)
    expect(telegramFromMarkdown('--- سلام دنیا ---').text).toBe(`${'-'.repeat(14)} سلام دنیا ${'-'.repeat(14)}`)
  })
})
