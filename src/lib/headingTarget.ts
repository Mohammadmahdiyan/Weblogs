import { normalizeSearchText } from './normalize.ts'

export interface HeadingCandidate {
  id: string
  text: string
}

function normalizedHeadingText(value: string): string {
  return normalizeSearchText(value).replace(/[\p{P}\p{S}\s]/gu, '')
}

/** Match a fragment against heading IDs or visible text, preferring exact and unambiguous matches. */
export function resolveHeadingTarget(fragment: string, headings: HeadingCandidate[]): string | null {
  const exactId = headings.find((heading) => heading.id === fragment)
  if (exactId) return exactId.id

  const normalizedFragment = normalizedHeadingText(fragment)
  if (!normalizedFragment) return null

  const exactText = headings.filter((heading) => normalizedHeadingText(heading.text) === normalizedFragment)
  if (exactText.length === 1) return exactText[0].id
  if (exactText.length > 1) return null

  const partial = headings.filter((heading) => normalizedHeadingText(heading.text).includes(normalizedFragment))
  return partial.length === 1 ? partial[0].id : null
}
