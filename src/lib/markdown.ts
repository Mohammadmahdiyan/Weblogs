import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import rehypeRaw from 'rehype-raw'
import rehypeReact, { type Options as RehypeReactOptions } from 'rehype-react'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified, type Plugin } from 'unified'
import type { Parent, Root } from 'hast'
import type { Root as MdastRoot } from 'mdast'

type MarkdownComponents = NonNullable<RehypeReactOptions['components']>

export const remarkComponents: Plugin<[], MdastRoot> = () => (tree) => tree

function removeUnsafeMarkup(parent: Parent): void {
  parent.children = parent.children.filter((node) => {
    if (node.type === 'element') {
      if (node.tagName.toLowerCase() === 'script') return false

      for (const property of Object.keys(node.properties)) {
        if (property.toLowerCase().startsWith('on')) delete node.properties[property]
      }
    }

    if ('children' in node) removeUnsafeMarkup(node)
    return true
  })
}

const rehypeStripUnsafe = () => (tree: Root) => removeUnsafeMarkup(tree)

export function createMarkdownProcessor(components: MarkdownComponents) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkComponents)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeStripUnsafe)
    .use(rehypeReact, { Fragment, jsx, jsxs, components })
}

export type { MarkdownComponents }