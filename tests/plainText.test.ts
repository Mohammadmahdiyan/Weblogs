import { describe, expect, it } from 'vitest'
import { markdownToPlainText } from '../src/lib/plainText.ts'

describe('markdownToPlainText', () => {
  it('includes authored Markdown text, blockquotes, image alt text and item titles', () => {
    const markdown = [
      '## شیعه به علی (رض) می‌گه مگس',
      '> وإن البعوض كان رجلا يستهزئ بالأنبياء فمسخه الله (عز)',
      '![سند اینکه اعتقادی به تناسخ داشته](./proof.jpg)',
      ':::item{title="این حدیث موافق قرآن هست یا مخالف قرآن؟" open}',
      'متن پاسخ',
      ':::',
    ].join('\n\n')
    const text = markdownToPlainText(markdown)
    expect(text).toContain('شیعه به علی (رض) می‌گه مگس')
    expect(text).toContain('وإن البعوض كان رجلا')
    expect(text).toContain('سند اینکه اعتقادی به تناسخ داشته')
    expect(text).toContain('این حدیث موافق قرآن هست یا مخالف قرآن؟')
    expect(text).toContain('متن پاسخ')
    expect(text).not.toContain('./proof.jpg')
    expect(text).not.toContain(':::item')
  })

  it('does not include directive syntax or raw HTML', () => {
    const markdown = [
      ':::modal{title="پنجره"}',
      '<h4 class="text-center">متن HTML</h4>',
      '::: ',
      'متن واقعی مقاله',
    ].join('\n')
    const text = markdownToPlainText(markdown)
    expect(text).toContain('متن واقعی مقاله')
    expect(text).not.toContain(':::modal')
    expect(text).not.toContain('پنجره')
    expect(text).not.toContain('متن HTML')
  })
})
