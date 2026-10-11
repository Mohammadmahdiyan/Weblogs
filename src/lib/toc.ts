import GithubSlugger from 'github-slugger'

export interface TocItem { level: number; title: string; id: string }

/**
 * Builds the table of contents from the markdown source (h2/h3).
 * Ids are produced by the same slugger algorithm as rehype-slug, so they match
 * the rendered heading ids. Headings inside fenced code blocks are ignored.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headings: TocItem[] = []
  const withoutCode = markdown.replace(/^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[`~]*[ \t]*$/gm, '')
  const expression = /^ {0,3}(#{1,3})\s+(.+?)\s*#*\s*$/gm
  for (const match of withoutCode.matchAll(expression)) {
    const title = match[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim()
    const id = slugger.slug(title)
    // `#` (level 1) in a body is demoted by the renderer; keep it out of the TOC like the original behaviour.
    if (match[1].length >= 2) headings.push({ level: match[1].length, title, id })
  }
  return headings
}
