import { normalizeSearchText } from './normalize.ts'

/**
 * «Closing heading»: an explicit end marker for a section.
 *
 * A `###` (or `####` …) section normally ends at the next heading of the same or a higher level. Sometimes the
 * text that follows is a continuation of the parent section, but Markdown has no way to say that, so the author
 * repeats the very same heading line where the section should end:
 *
 *     ### Test
 *     the text of the section
 *     ### Test          ← closing heading: copying the first one stops here
 *     text that continues the parent section
 *
 * The closing heading is only a marker. It is not shown in the article, not in the table of contents and not in
 * anything that is copied.
 *
 * A heading closes another one only when, looking back, the nearest earlier heading of the same or a higher level
 * is an identical heading (same depth, same text) that is still open. So the same title used under two different
 * parents (`## A / ### Example … ## B / ### Example`) is never taken as a marker.
 */

/** `##` sections end at the next `##` by themselves; markers are for `###` and deeper. */
export const MIN_CLOSING_DEPTH = 3

export interface HeadingSignature {
  depth: number
  /** The heading text as the reader sees it (compared after normalization). */
  text: string
}

/** Indexes (into `headings`, in document order) of the headings that are closing markers. */
export function findClosingHeadings(headings: readonly HeadingSignature[]): Set<number> {
  const keys = headings.map((heading) => normalizeSearchText(heading.text))
  const closing = new Set<number>()
  const closed = new Set<number>()

  for (let index = 0; index < headings.length; index += 1) {
    const { depth } = headings[index]
    if (depth < MIN_CLOSING_DEPTH || !keys[index]) continue

    // The nearest earlier heading that is not itself a marker and is of the same or a higher level.
    let before = -1
    for (let back = index - 1; back >= 0; back -= 1) {
      if (!closing.has(back) && headings[back].depth <= depth) {
        before = back
        break
      }
    }
    if (before < 0 || closed.has(before)) continue
    if (headings[before].depth !== depth || keys[before] !== keys[index]) continue

    closing.add(index)
    closed.add(before)
  }
  return closing
}

// ───────────────────────────── the same rule on a Markdown syntax tree (mdast)

interface TreeNode {
  type: string
  depth?: number
  value?: unknown
  alt?: unknown
  children?: TreeNode[]
  data?: Record<string, unknown>
}

function visibleText(node: TreeNode): string {
  if (node.type === 'html') return ''
  if (typeof node.value === 'string' && node.type !== 'html') return node.value
  if (node.type === 'image' && typeof node.alt === 'string') return node.alt
  return (node.children ?? []).map(visibleText).join('')
}

function collectHeadings(node: TreeNode, into: TreeNode[]): void {
  for (const child of node.children ?? []) {
    if (child.type === 'heading') into.push(child)
    collectHeadings(child, into)
  }
}

/** Sets `data.closingHeading = true` on every closing heading of the tree (document order, whole article). */
export function markClosingHeadings(tree: unknown): void {
  const headings: TreeNode[] = []
  collectHeadings(tree as TreeNode, headings)
  const closing = findClosingHeadings(
    headings.map((heading) => ({ depth: heading.depth ?? 6, text: visibleText(heading) })),
  )
  closing.forEach((index) => {
    const heading = headings[index]
    heading.data = { ...heading.data, closingHeading: true }
  })
}

export const isClosingHeading = (node: { data?: unknown }): boolean =>
  (node.data as { closingHeading?: unknown } | undefined)?.closingHeading === true

/** Removes the marked closing headings from the tree (the article page does not show them). */
export function removeClosingHeadings(tree: unknown): void {
  const strip = (node: TreeNode): void => {
    if (!node.children) return
    node.children = node.children.filter((child) => !(child.type === 'heading' && isClosingHeading(child)))
    node.children.forEach(strip)
  }
  strip(tree as TreeNode)
}
