import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'

type MarkdownNode = {
  type: string
  value?: unknown
  alt?: unknown
  name?: unknown
  attributes?: Record<string, unknown>
  children?: unknown[]
}

/** Extracts authored, searchable text from Markdown without markup or frontmatter. */
export function markdownToPlainText(markdown: string | undefined): string {
  if (typeof markdown !== 'string' || !markdown.trim()) return ''

  const tree = unified().use(remarkParse).use(remarkDirective).parse(markdown) as unknown as MarkdownNode
  const chunks: string[] = []
  const walk = (node: MarkdownNode): void => {
    // Raw HTML is intentionally ignored, including its contents.
    if (node.type === 'html') return
    if (node.type === 'image' && typeof node.alt === 'string') chunks.push(node.alt)
    if (node.type === 'text' && typeof node.value === 'string') chunks.push(node.value)
    if (node.type === 'inlineCode' && typeof node.value === 'string') chunks.push(node.value)
    if (node.type === 'code' && typeof node.value === 'string') chunks.push(node.value)

    // A directive's syntax/attributes are not prose, but item titles are authored questions.
    if (
      (node.type === 'containerDirective' || node.type === 'leafDirective' || node.type === 'textDirective') &&
      node.name === 'item'
    ) {
      const title = node.attributes?.title
      if (typeof title === 'string') chunks.push(title)
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === 'object') walk(child as MarkdownNode)
      }
    }
  }

  walk(tree)
  return chunks.join(' ').replace(/[|*_~`]/g, ' ').replace(/\s+/g, ' ').trim()
}
