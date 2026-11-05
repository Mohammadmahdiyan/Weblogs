import type { Paragraph, Root as MdastRoot } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * `--- text ---` on a line of its own → a divider with the text in the middle of the line (the `mdx-divider`
 * element). A plain `---` line is still the ordinary thematic break (<hr>). The text may use inline Markdown
 * (`**bold**`, links…). Needs a blank line before it, like any `---` line, or Markdown reads the line above as a heading.
 */
export function markDividers(tree: MdastRoot): void {
  visit(tree, 'paragraph', (node) => {
    const first = node.children[0]
    const last = node.children[node.children.length - 1]
    if (first?.type !== 'text' || last?.type !== 'text') return
    // One line only: a paragraph that goes on over several lines is ordinary text.
    if (node.children.some((child) => child.type === 'break' || (child.type === 'text' && child.value.includes('\n')))) return

    const open = first.value.match(/^-{3,}[ \t]+/)
    const close = last.value.match(/[ \t]+-{3,}[ \t]*$/)
    if (!open || !close) return

    if (first === last) {
      // «--- ---» has nothing between the two ends.
      if (open[0].length + close[0].length >= first.value.length) return
      const inner = first.value.slice(open[0].length, first.value.length - close[0].length)
      if (!inner.trim()) return
      first.value = inner
    } else {
      first.value = first.value.slice(open[0].length)
      last.value = last.value.slice(0, last.value.length - close[0].length)
    }

    node.children = node.children.filter((child) => !(child.type === 'text' && child.value === ''))
    // `hName` is how remark-rehype is told to make a different element (mdast's own type does not list it).
    const data = (node.data ?? {}) as Record<string, unknown>
    data.hName = 'mdx-divider'
    node.data = data as Paragraph['data']
  })
}

export const remarkDividers: Plugin<[], MdastRoot> = () => markDividers
