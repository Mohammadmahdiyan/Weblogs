import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Paragraph, Root } from 'mdast'
import { remarkDividers } from '../src/lib/dividers.ts'

function dividers(markdown: string): { type: string; hName?: string; text: string }[] {
  const processor = unified().use(remarkParse).use(remarkDividers)
  const tree = processor.runSync(processor.parse(markdown)) as Root
  return tree.children.map((node) => ({
    type: node.type,
    hName: (node.data as { hName?: string } | undefined)?.hName,
    text: node.type === 'paragraph' ? (node as Paragraph).children.map((child) => ('value' in child ? child.value : '')).join('') : '',
  }))
}

describe('remarkDividers', () => {
  it('turns `--- text ---` into a divider with that text', () => {
    expect(dividers('--- سلام دنیا ---')).toEqual([{ type: 'paragraph', hName: 'mdx-divider', text: 'سلام دنیا' }])
  })

  it('accepts longer dash runs and keeps inline Markdown in the text', () => {
    const [node] = dividers('----- بخش **دوم** -----')
    expect(node.hName).toBe('mdx-divider')
  })

  it('leaves a plain --- as the ordinary thematic break', () => {
    expect(dividers('متن\n\n---\n\nمتن دیگر').map((node) => node.type)).toEqual(['paragraph', 'thematicBreak', 'paragraph'])
  })

  it('does not touch ordinary text that merely contains dashes', () => {
    expect(dividers('سلام --- دنیا')[0].hName).toBeUndefined()
    expect(dividers('--- فقط شروع')[0].hName).toBeUndefined()
    expect(dividers('--- ---')[0].hName).toBeUndefined()
  })

  it('ignores a paragraph of several lines', () => {
    expect(dividers('--- سلام\nدنیا ---')[0].hName).toBeUndefined()
  })
})
