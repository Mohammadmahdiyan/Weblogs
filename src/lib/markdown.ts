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
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'

type MarkdownComponents = NonNullable<RehypeReactOptions['components']> & {
  'mdx-spoiler'?: import('react').ComponentType<{
    children?: import('react').ReactNode
    animationText?: string
    hasAnimationDirective?: boolean
  }>
}
interface DirectiveNode extends Node {
  type: 'containerDirective' | 'leafDirective' | 'textDirective'
  name: string
  attributes?: Record<string, string | null>
  children?: Node[]
  data?: {
    hName?: string
    hProperties?: Record<string, unknown>
    [key: string]: unknown
  }
}

interface MediaImageNode extends Node {
  type: 'image'
  url: string
  alt: string | null
  title: string | null
  data?: DirectiveNode['data']
}

const directiveNames = new Set([
  'accordion', 'item', 'alert', 'avatar', 'badge', 'breadcrumbs', 'button', 'buttons',
  'card', 'collapse', 'modal', 'gallery', 'iconbutton', 'list', 'pagination', 'popover',
  'rating', 'select', 'skeleton', 'spinner', 'switch', 'tooltip', 'lead', 'video',
  'audio', 'suggested', 'course', 'embed', 'youtube', 'instagram', 'aparat', 'source',
])

function isDirectiveNode(node: Node): node is DirectiveNode {
  return (
    (node.type === 'containerDirective' || node.type === 'leafDirective' || node.type === 'textDirective') &&
    'name' in node && typeof node.name === 'string'
  )
}

function toReactProperty(name: string): string {
  // `ref` is reserved by React, so the `:::source{ref=""}` attribute is exposed as `reference`.
  if (name === 'ref') return 'reference'
  return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

function setDirectiveElement(node: DirectiveNode): void {
  const properties: Record<string, unknown> = { directiveName: node.name }
  for (const [name, value] of Object.entries(node.attributes ?? {})) {
    properties[toReactProperty(name)] = value == null || value === '' ? true : value
  }

  node.data = {
    ...node.data,
    hName: directiveNames.has(node.name) ? `mdx-${node.name}` : 'mdx-unknown',
    hProperties: properties,
  }
}

function setMediaElement(node: MediaImageNode): void {
  const pathname = node.url.split(/[?#]/, 1)[0].toLowerCase()
  const type = /\.(mp4|webm)$/.test(pathname)
    ? 'video'
    : /\.(mp3|ogg|wav|m4a)$/.test(pathname)
      ? 'audio'
      : null
  if (!type) return

  node.data = {
    ...node.data,
    hName: `mdx-${type}`,
    hProperties: {
      src: node.url,
      alt: node.alt ?? '',
      ...(node.title ? { title: node.title } : {}),
    },
  }
}

function nodePlainText(node: Node): string {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child: Node) => nodePlainText(child)).join(' ')
  }
  return ''
}

function collectFaqItems(node: Node): { question: string; answer: string }[] {
  const collected: { question: string; answer: string }[] = []
  if (isDirectiveNode(node) && node.name === 'item') {
    const question = node.attributes?.title?.trim()
    const answer = node.children?.map(nodePlainText).join(' ').replace(/\s+/g, ' ').trim() ?? ''
    if (question && answer) collected.push({ question, answer })
    return collected
  }

  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children as Node[]) collected.push(...collectFaqItems(child))
  }
  return collected
}

/**
 * The page's only <h1> is the frontmatter title. If (and only if) the body itself
 * contains a `# Heading`, every body heading is demoted by one level (max h6) so
 * the document outline stays valid. Bodies that start at `##` are left alone.
 */
export const remarkHeadingLevels: Plugin<[], MdastRoot> = () => (tree) => {
  let hasLevelOne = false
  visit(tree, 'heading', (node) => {
    if (node.depth === 1) hasLevelOne = true
  })
  if (!hasLevelOne) return
  visit(tree, 'heading', (node) => {
    node.depth = Math.min(6, node.depth + 1) as 1 | 2 | 3 | 4 | 5 | 6
  })
}

export const remarkComponents: Plugin<[], MdastRoot> = () => (tree) => {
  visit(tree, (node) => {
    if (isDirectiveNode(node)) setDirectiveElement(node)
    else if (node.type === 'image') setMediaElement(node as MediaImageNode)
  })

  visit(tree, (node, index, parent) => {
    if (!isDirectiveNode(node) || node.name !== 'accordion' || index === undefined || !parent) return
    node.children ??= []
    const siblingIndex = index + 1
    while (siblingIndex < parent.children.length) {
      const sibling = parent.children[siblingIndex]
      if (!isDirectiveNode(sibling) || sibling.name !== 'item') break
      node.children.push(sibling)
      parent.children.splice(siblingIndex, 1)
    }
  })

  const blockDirectives = new Set([
    'mdx-avatar', 'mdx-breadcrumbs', 'mdx-buttons', 'mdx-collapse', 'mdx-gallery',
    'mdx-iconbutton', 'mdx-list', 'mdx-modal', 'mdx-pagination', 'mdx-select',
    'mdx-skeleton', 'mdx-spinner', 'mdx-switch', 'mdx-video', 'mdx-audio',
    'mdx-embed', 'mdx-youtube', 'mdx-instagram', 'mdx-aparat',
  ])

  visit(tree, 'paragraph', (node, index, parent) => {
    if (index === undefined || !parent || node.children.length !== 1) return
    const hName = node.children[0].data?.hName
    if (typeof hName === 'string' && blockDirectives.has(hName)) {
      parent.children.splice(index, 1, node.children[0])
      return index
    }
  })

  visit(tree, 'containerDirective', (node) => {
    if (!isDirectiveNode(node)) return

    if (node.name === 'accordion') {
      const isFaq = 'faq' in (node.attributes ?? {}) || node.attributes?.title?.trim() === 'سوالات متداول'
      if (!isFaq) return
      const faqItems = collectFaqItems(node)
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, faqItems: JSON.stringify(faqItems) },
      }
      return
    }

    if (node.name !== 'suggested') return
    const paragraph = node.children.find((child) => child.type === 'paragraph')
    const link = paragraph?.type === 'paragraph'
      ? paragraph.children.find((child) => child.type === 'link')
      : undefined
    if (link?.type !== 'link') return

    node.attributes = { ...node.attributes, href: node.attributes?.href ?? link.url }
    node.children = paragraph?.type === 'paragraph'
      ? [{ ...paragraph, children: link.children }]
      : []
  })
}

const urlProperties = new Set(['href', 'src', 'xlinkhref', 'action', 'formaction', 'poster', 'data'])

function isJavascriptUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  // Browsers ignore control characters and whitespace inside the scheme.
  // eslint-disable-next-line no-control-regex
  return /^javascript:/i.test(value.replace(/[\u0000-\u0020]/g, ''))
}

function removeUnsafeMarkup(parent: Parent): void {
  parent.children = parent.children.filter((node) => {
    if (node.type === 'element') {
      if (node.tagName.toLowerCase() === 'script') return false

      for (const property of Object.keys(node.properties)) {
        const lower = property.toLowerCase()
        if (lower.startsWith('on')) delete node.properties[property]
        else if (urlProperties.has(lower) && isJavascriptUrl(node.properties[property])) delete node.properties[property]
      }
    }

    if ('children' in node) removeUnsafeMarkup(node)
    return true
  })
}

const rehypeStripUnsafe = () => (tree: Root) => removeUnsafeMarkup(tree)

/** Turns Telegram-style ||spoilers|| into a safe React component in Markdown text. */
const remarkSpoilers: Plugin<[], MdastRoot> = () => (tree) => {
  visit(tree, 'text', (node, index, parent) => {
    if (
      index === undefined ||
      !parent ||
      !('children' in parent) ||
      !Array.isArray(parent.children)
    ) {
      return
    }

    const value = node.value
    const pattern = /\|\|([^|\n]+)\|\|(?:\{متن انیمیشن:([^}]*)\})?/g

    if (!pattern.test(value)) return
    pattern.lastIndex = 0

    const replacement: typeof parent.children = []
    let cursor = 0

    for (const match of value.matchAll(pattern)) {
      const start = match.index ?? 0

      if (start > cursor) {
        replacement.push({
          type: 'text',
          value: value.slice(cursor, start),
        })
      }

      const hasAnimationDirective =
        match[0].includes('{متن انیمیشن:')

      const customAnimationText = match[2]?.trim() ?? ''

      replacement.push({
        type: 'emphasis',
        data: {
          hName: 'mdx-spoiler',
          hProperties: {
            hasAnimationDirective,
            animationText: customAnimationText,
          },
        },
        children: [{ type: 'text', value: match[1] ?? '' }],
      })

      cursor = start + match[0].length
    }

    if (cursor < value.length) {
      replacement.push({
        type: 'text',
        value: value.slice(cursor),
      })
    }

    parent.children.splice(index, 1, ...replacement)
    return index + replacement.length - 1
  })
}

export function createMarkdownProcessor(components: MarkdownComponents) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkSpoilers)
    .use(remarkHeadingLevels)
    .use(remarkComponents)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeStripUnsafe)
    .use(rehypeReact, { Fragment, jsx, jsxs, components })
}

export type { MarkdownComponents }