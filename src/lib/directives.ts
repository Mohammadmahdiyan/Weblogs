/**
 * Container directives (`:::accordion`, `:::item`, `:::modal` …) only nest when the OUTER one has more
 * colons than the inner one. Writing a modal inside an accordion item with the same number of colons
 * makes the modal's closing `:::` end the item instead, and the page breaks.
 *
 * This rewrites the fences so that nesting always works whatever number of colons the author typed:
 * every container gets 2 + (how many levels of containers it holds) colons. Text inside code fences is
 * untouched, and a document whose fences do not balance is returned exactly as written.
 */

const OPEN = /^(\s{0,3})(:{3,})(?=[A-Za-z])/
const CLOSE = /^(\s{0,3})(:{3,})[ \t]*\r?$/
const CODE_FENCE = /^\s{0,3}(`{3,}|~{3,})/

interface Container {
  open: number
  close: number
  height: number
}

export function normalizeDirectiveFences(markdown: string): string {
  if (!markdown.includes(':::')) return markdown

  const lines = markdown.split('\n')
  const stack: Container[] = []
  const containers: Container[] = []
  let fence: string | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const codeFence = line.match(CODE_FENCE)
    if (codeFence) {
      const marker = codeFence[1]
      if (fence === null) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null
      continue
    }
    if (fence !== null) continue

    if (OPEN.test(line)) {
      const container: Container = { open: index, close: -1, height: 1 }
      stack.push(container)
      containers.push(container)
    } else if (CLOSE.test(line)) {
      const container = stack.pop()
      if (!container) return markdown
      container.close = index
      const parent = stack[stack.length - 1]
      if (parent) parent.height = Math.max(parent.height, container.height + 1)
    }
  }
  if (stack.length > 0) return markdown

  const LEADING_COLONS = /^(\s{0,3}):{3,}/
  for (const container of containers) {
    const colons = ':'.repeat(2 + container.height)
    for (const index of [container.open, container.close]) {
      lines[index] = lines[index].replace(LEADING_COLONS, (_match, indent: string) => `${indent}${colons}`)
    }
  }
  return lines.join('\n')
}
