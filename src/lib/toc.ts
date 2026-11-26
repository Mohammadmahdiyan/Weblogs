import GithubSlugger from 'github-slugger'
import { splitInline } from './inline.ts'
import { isEmoji } from './emojiRegistry.ts'
import { findClosingHeadings } from './closingHeadings.ts'

export interface TocItem { level: number; title: string; id: string }

/**
 * Builds the table of contents from the markdown source (h2/h3).
 * Ids are produced by the same slugger algorithm as rehype-slug, so they match
 * the rendered heading ids. Headings inside fenced code blocks are ignored.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const found: { level: number; title: string; slugTitle: string }[] = []
  const withoutCode = markdown.replace(/^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[`~]*[ \t]*$/gm, '')
  const expression = /^ {0,3}(#{1,3})\s+(.+?)\s*#*\s*$/gm
  for (const match of withoutCode.matchAll(expression)) {
    // Mini-text keeps its words in the heading; emoji are images with no text.
    const visibleTitle = splitInline(match[2], isEmoji)
      .map((segment) => (segment.type === 'text' ? segment.value : segment.type === 'mini' ? segment.text : ''))
      .join('')
    const title = visibleTitle.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim()

    // remarkHonorifics turns these parenthesized markers into image-backed
    // React components with no text content. rehype-slug therefore excludes
    // them from the rendered heading id; use the same visible text for slugs.
    const slugTitle = title
      .replace(/\(\s*(?:صلى الله عليه وسلم|ﷺ|ص|عليه السلام|عليه الصلاة والسلام|عليها السلام|عليهم السلام|رضي الله عنه|رضي الله عنها|رضي الله عنهما|رضي الله عنهم|رضي الله عنهن|رض|رحمه الله|رحمها الله|رحمهم الله|رحمهما الله|رحمهن الله|رح|جل جلاله|عز وجل|جل وعلا|سبحانه وتعالى|تبارك وتعالى|رضها|رضهما|رضهم|رضهن|رحها|رحهم|رحهما|رحهن|جل|عز|سبح|تبارك|صلى الله عليه و آله|صا|حفظه الله|حف)\s*\)/g, '')
      .trim()
    found.push({ level: match[1].length, title, slugTitle })
  }

  // A repeated `###` line that only marks where a section ends is not rendered, so it gets no id and no entry
  // (and must not use up a slug: the ids of later headings with the same title would shift).
  const closing = findClosingHeadings(found.map((heading) => ({ depth: heading.level, text: heading.slugTitle })))
  const headings: TocItem[] = []
  found.forEach((heading, index) => {
    if (closing.has(index)) return
    const id = slugger.slug(heading.slugTitle)
    // `#` (level 1) in a body is demoted by the renderer; keep it out of the TOC like the original behaviour.
    if (heading.level >= 2) headings.push({ level: heading.level, title: heading.title, id })
  })
  return headings
}
