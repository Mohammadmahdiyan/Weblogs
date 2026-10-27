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

  it('makes headings bold, lists with bullets, writes only the file name of an image and drops relative links', () => {
    const { text } = telegramFromMarkdown('## عنوان\n\n- الف\n- ب\n\n![تصویر](./a.jpg) [محلی](#x)')
    expect(text).toBe('**عنوان**\n\n• الف\n• ب\n\na.jpg محلی')
  })

  it('puts a quote with blank lines (>> … <<) in ONE quote', () => {
    expect(telegramFromMarkdown('>> الف\n\nب<<').text).toBe('> الف\n>\n> ب')
  })

  it('writes accordion titles and chat messages', () => {
    const { text } = telegramFromMarkdown(':::accordion\n:::item{title="عنوان"}\nسوال1 : (این چیست؟)\nجواب1 : (پاسخ)\n:::\n:::')
    expect(text).toBe('**عنوان**\n\n**سوال ۱:** این چیست؟\n\n**جواب ۱:** پاسخ')
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

  it('writes only the file name (with extension) of a picture, video or sound — never the alt text', () => {
    expect(telegramFromMarkdown('![عکس پروژه](./17hazar-in-qadir-top-site.png)').text).toBe('17hazar-in-qadir-top-site.png')
    expect(telegramFromMarkdown('![](./photos/my%20pic.png?v=2)').text).toBe('my pic.png')
    expect(telegramFromMarkdown('![](./a.mp4)').text).toBe('a.mp4')
    expect(telegramFromMarkdown('::video{link="./clip.mp4", cover="./c.jpg"}').text).toBe('clip.mp4')
    expect(telegramFromMarkdown('::audio{link="https://example.com/x/music.mp3"}').text).toBe('music.mp3')
  })

  it('numbers pictures from the top when there are several', () => {
    const two = '![shikh-sadogh-s188](./sadoq-ravayeat-qadir.jpg)\n![کلینی در کافی جلد 4](./kolane-eid-qadir.jpg)'
    expect(telegramFromMarkdown(two).text).toBe('1. sadoq-ravayeat-qadir.jpg\n2. kolane-eid-qadir.jpg')
    expect(telegramFromMarkdown('متن\n\n![](a.png)\n\nمتن دو\n\n![](b.png)').text).toBe('متن\n\n1. a.png\n\nمتن دو\n\n2. b.png')
    expect(telegramFromMarkdown('![](a.png)\n\n::video{link="v.mp4"}').text).toBe('a.png\n\nv.mp4')
  })
})
