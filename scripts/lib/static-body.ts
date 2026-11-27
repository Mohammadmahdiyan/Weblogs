import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { markClosingHeadings, removeClosingHeadings } from '../../src/lib/closingHeadings.ts'
import { prepareSource } from '../../src/lib/telegram.ts'
import { collections, type CollectionId } from './collections.ts'

/*
  The article text as plain, readable HTML for the pre-rendered page (see prerender.ts).

  The site is a single-page app, so without this a visitor that does not run JavaScript (a search crawler, or an
  AI assistant asked to read the page address) sees only the title and the description. This is NOT how the page
  looks: the app replaces it as soon as it starts. It is only meant to be read as text: headings, paragraphs,
  quotes, lists, tables. Components (accordion, chat, gallery …) become plain blocks and keep their text.
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

interface DirectiveNode {
  attributes?: Record<string, string | null | undefined> | null
  children?: unknown[]
}

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** A small block: the directive's title (when it has one) in bold, then what it holds. */
function directiveBlock(tagName: 'div' | 'span') {
  return (state: { all: (node: unknown) => unknown[] }, node: DirectiveNode) => {
    const attributes = node.attributes ?? {}
    const title = toText(attributes.title) || toText(attributes.label) || toText(attributes.question)
    const children = state.all(node) as unknown[]
    const heading = title
      ? [{ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'element', tagName: 'strong', properties: {}, children: [{ type: 'text', value: title }] }] }]
      : []
    return { type: 'element', tagName, properties: {}, children: [...heading, ...children] }
  }
}

export async function renderStaticBody(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(() => (tree) => {
      // A repeated heading that only marks where a section ends is not part of the text (closingHeadings.ts).
      markClosingHeadings(tree)
      removeClosingHeadings(tree)
    })
    .use(remarkRehype, {
      handlers: {
        containerDirective: directiveBlock('div'),
        leafDirective: directiveBlock('div'),
        textDirective: directiveBlock('span'),
      } as never,
    })
    .use(rehypeStringify)
  return String(await processor.process(prepareSource(markdown)))
}

/**
 * The Markdown of one page as the build wrote it: the article itself, or one page (`pageNumber`) of a book.
 * Returns null when the file is not there (the page then keeps the title and description only).
 */
export async function readStaticBody(
  collectionId: CollectionId,
  slug: string,
  pageNumber?: number,
): Promise<string | null> {
  const collection = collections[collectionId]
  const file =
    pageNumber === undefined
      ? path.join(projectRoot, 'src', 'generated', collection.files.bodiesDir, ...slug.split('/')) + '.md'
      : path.join(projectRoot, 'public', collection.mediaDir, ...slug.split('/'), 'pages', `${pageNumber}.md`)
  try {
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}
