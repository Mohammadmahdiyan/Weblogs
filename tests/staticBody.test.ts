import { describe, expect, it } from 'vitest'
import { renderStaticBody } from '../scripts/lib/static-body.ts'

describe('renderStaticBody', () => {
  it('writes headings, paragraphs and quotes as plain HTML', async () => {
    const html = await renderStaticBody('مقدمه\n\n## بخش اول\n\nمتن **مهم**\n\n### زیر بخش\n\n> نقل‌قول\n')
    expect(html).toContain('<h2>بخش اول</h2>')
    expect(html).toContain('<h3>زیر بخش</h3>')
    expect(html).toContain('<strong>مهم</strong>')
    expect(html).toContain('<blockquote>')
  })

  it('keeps the text of components, shows no marker comments and drops a closing heading', async () => {
    const html = await renderStaticBody('### الف\n\nمتن\n\n### الف\n\nادامه\n\n>$ بلند\n')
    expect(html.match(/<h3>/g)).toHaveLength(1)
    expect(html).toContain('ادامه')
    expect(html).not.toContain('quote-long')
  })
})
